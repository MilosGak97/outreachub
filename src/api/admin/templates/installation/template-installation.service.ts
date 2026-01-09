import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, DataSource, In, Repository } from 'typeorm';
import { CrmTemplateRepository } from '../../../repositories/postgres/template/crm-template.repository';
import { CompanyTemplateRepository } from '../../../repositories/postgres/template/company-template.repository';
import { CompanyInstalledModuleRepository } from '../../../repositories/postgres/template/company-installed-module.repository';
import { CrmTemplateModuleRepository } from '../../../repositories/postgres/template/crm-template-module.repository';
import { CrmTemplate } from '../../../entities/template/crm-template.entity';
import { CrmTemplateModule } from '../../../entities/template/crm-template-module.entity';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';
import { CrmObjectField } from '../../../entities/object/crm-object-field.entity';
import { CrmAssociationType } from '../../../entities/object/crm-association-type.entity';
import { CrmObject } from '../../../entities/object/crm-object.entity';
import { CrmObjectAssociation } from '../../../entities/object/crm-object-association.entity';
import { CompanyInstalledModule } from '../../../entities/template/company-installed-module.entity';
import { CompanyTemplate } from '../../../entities/template/company-template.entity';
import { Company } from '../../../entities/company.entity';
import { InstallationResultDto } from '../dto/responses/installation-result.dto';
import { UninstallModuleResponseDto } from '../dto/responses/uninstall-module-response.dto';
import { CompanyTemplateInstallationResponseDto } from '../dto/responses/company-template-installation-response.dto';
import { TemplateErrorCode } from '../../../enums/template/template-error-code.enum';

@Injectable()
export class TemplateInstallationService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly templateRepository: CrmTemplateRepository,
    private readonly templateModuleRepository: CrmTemplateModuleRepository,
    private readonly companyTemplateRepository: CompanyTemplateRepository,
    private readonly companyInstalledModuleRepository: CompanyInstalledModuleRepository,
  ) {}

  async installTemplate(params: {
    companyId: string;
    templateSlug: string;
    modules?: string[];
    installAllModules?: boolean;
  }): Promise<InstallationResultDto> {
    const { companyId, templateSlug, modules, installAllModules } = params;

    const template = await this.templateRepository.findBySlugWithFullTree(templateSlug);
    if (!template) {
      throw new NotFoundException(`CRM template with slug '${templateSlug}' not found`);
    }
    if (!template.isActive) {
      throw new BadRequestException(TemplateErrorCode.TEMPLATE_INACTIVE);
    }

    const company = await this.dataSource
      .getRepository(Company)
      .findOne({ where: { id: companyId } });
    if (!company) {
      throw new NotFoundException(TemplateErrorCode.COMPANY_NOT_FOUND);
    }

    const alreadyInstalled = await this.companyTemplateRepository.hasTemplate(companyId);
    if (alreadyInstalled) {
      throw new ConflictException('Company already has a template installed.');
    }

    const modulesToInstall = this.selectModules(
      template,
      modules,
      installAllModules ?? false,
    );

    if (modulesToInstall.length === 0) {
      throw new BadRequestException('No template modules were selected for installation.');
    }

    this.ensureBlueprintApiNamesUnique(modulesToInstall);
    this.validateModuleDependencies(modulesToInstall);
    this.validateModuleConflicts(modulesToInstall);

    const orderedModules = this.sortModulesByDependencies(modulesToInstall);

    const counts = await this.dataSource.transaction(async (manager) => {
      const objectTypeRepo = manager.getRepository(CrmObjectType);
      const objectFieldRepo = manager.getRepository(CrmObjectField);
      const associationTypeRepo = manager.getRepository(CrmAssociationType);
      const installedModuleRepo = manager.getRepository(CompanyInstalledModule);
      const companyTemplateRepo = manager.getRepository(CompanyTemplate);

      const objectTypeIdByApiName = new Map<string, string>();

      const moduleCounts = await this.installModules({
        companyId,
        modules: orderedModules,
        objectTypeIdByApiName,
        objectTypeRepo,
        objectFieldRepo,
        associationTypeRepo,
        installedModuleRepo,
      });

      const companyTemplate = companyTemplateRepo.create({
        companyId,
        templateId: template.id,
      });
      await companyTemplateRepo.save(companyTemplate);

      return moduleCounts;
    });

    return {
      success: true,
      templateSlug: template.slug,
      installedModules: orderedModules.map((module) => module.slug),
      createdObjectTypes: counts.createdObjectTypes,
      createdFields: counts.createdFields,
      createdAssociations: counts.createdAssociations,
    };
  }

  async installModule(params: {
    companyId: string;
    moduleSlug: string;
  }): Promise<InstallationResultDto> {
    const { companyId, moduleSlug } = params;

    const companyTemplate = await this.companyTemplateRepository.findByCompanyId(companyId);
    if (!companyTemplate) {
      throw new NotFoundException('Company does not have a template installed.');
    }

    const module = await this.templateModuleRepository.findBySlug(
      companyTemplate.templateId,
      moduleSlug,
    );

    if (!module) {
      throw new NotFoundException(
        `CRM template module with slug '${moduleSlug}' not found`,
      );
    }

    const moduleWithBlueprints = await this.templateModuleRepository.findWithBlueprints(
      module.id,
    );

    const isInstalled = await this.companyInstalledModuleRepository.isModuleInstalled(
      companyId,
      module.id,
    );
    if (isInstalled) {
      throw new ConflictException('Module is already installed for this company.');
    }

    const installedModules = await this.companyInstalledModuleRepository.findByCompanyId(
      companyId,
    );
    const installedSlugs = installedModules
      .map((installed) => installed.module?.slug)
      .filter(Boolean) as string[];

    const missingDependencies = (moduleWithBlueprints.dependsOn ?? []).filter(
      (slug) => !installedSlugs.includes(slug),
    );
    if (missingDependencies.length > 0) {
      throw new BadRequestException(
        `Module '${moduleSlug}' depends on [${missingDependencies.join(', ')}].`,
      );
    }

    const conflicts = (moduleWithBlueprints.conflictsWith ?? []).filter((slug) =>
      installedSlugs.includes(slug),
    );
    if (conflicts.length > 0) {
      throw new BadRequestException(
        `Module '${moduleSlug}' conflicts with [${conflicts.join(', ')}].`,
      );
    }

    const conflictingInstalled = installedModules.filter((installed) =>
      (installed.module?.conflictsWith ?? []).includes(moduleSlug),
    );
    if (conflictingInstalled.length > 0) {
      const conflictingSlugs = conflictingInstalled
        .map((installed) => installed.module?.slug)
        .filter(Boolean);
      throw new BadRequestException(
        `Module '${moduleSlug}' conflicts with [${conflictingSlugs.join(', ')}].`,
      );
    }

    const counts = await this.dataSource.transaction(async (manager) => {
      const objectTypeRepo = manager.getRepository(CrmObjectType);
      const objectFieldRepo = manager.getRepository(CrmObjectField);
      const associationTypeRepo = manager.getRepository(CrmAssociationType);
      const installedModuleRepo = manager.getRepository(CompanyInstalledModule);

      const requiredApiNames = this.collectRequiredApiNames(moduleWithBlueprints);
      const existingObjectTypes = requiredApiNames.length
        ? await objectTypeRepo.find({
            where: {
              company: { id: companyId },
              apiName: In(requiredApiNames),
            },
          })
        : [];

      const objectTypeIdByApiName = new Map(
        existingObjectTypes.map((objectType) => [objectType.apiName, objectType.id]),
      );

      const newObjectApiNames = (moduleWithBlueprints.blueprintObjects ?? []).map(
        (object) => object.apiName,
      );
      const duplicates = newObjectApiNames.filter((apiName) =>
        objectTypeIdByApiName.has(apiName),
      );
      if (duplicates.length > 0) {
        throw new BadRequestException(
          `Object apiName values already exist: [${duplicates.join(', ')}].`,
        );
      }

      const moduleCounts = await this.installModules({
        companyId,
        modules: [moduleWithBlueprints],
        objectTypeIdByApiName,
        objectTypeRepo,
        objectFieldRepo,
        associationTypeRepo,
        installedModuleRepo,
      });

      return moduleCounts;
    });

    return {
      success: true,
      templateSlug: companyTemplate.template?.slug ?? '',
      installedModules: [moduleWithBlueprints.slug],
      createdObjectTypes: counts.createdObjectTypes,
      createdFields: counts.createdFields,
      createdAssociations: counts.createdAssociations,
    };
  }

  async uninstallModule(params: {
    companyId: string;
    moduleSlug: string;
    force?: boolean;
  }): Promise<UninstallModuleResponseDto> {
    const { companyId, moduleSlug, force } = params;

    const companyTemplate = await this.companyTemplateRepository.findByCompanyId(companyId);
    if (!companyTemplate) {
      throw new NotFoundException('Company does not have a template installed.');
    }

    const module = await this.templateModuleRepository.findBySlug(
      companyTemplate.templateId,
      moduleSlug,
    );

    if (!module) {
      throw new NotFoundException(
        `CRM template module with slug '${moduleSlug}' not found`,
      );
    }

    if (module.isCore) {
      throw new BadRequestException('Core modules cannot be uninstalled.');
    }

    const isInstalled = await this.companyInstalledModuleRepository.isModuleInstalled(
      companyId,
      module.id,
    );
    if (!isInstalled) {
      throw new BadRequestException('Module is not installed for this company.');
    }

    const installedModules = await this.companyInstalledModuleRepository.findByCompanyId(
      companyId,
    );
    const dependentModules = installedModules.filter(
      (installed) =>
        installed.module?.slug !== module.slug &&
        (installed.module?.dependsOn ?? []).includes(moduleSlug),
    );
    if (dependentModules.length > 0) {
      const dependentSlugs = dependentModules
        .map((installed) => installed.module?.slug)
        .filter(Boolean);
      throw new BadRequestException(
        `Module '${moduleSlug}' is required by [${dependentSlugs.join(', ')}].`,
      );
    }

    const moduleWithBlueprints = await this.templateModuleRepository.findWithBlueprints(
      module.id,
    );

    const blueprintObjectIds = (moduleWithBlueprints.blueprintObjects ?? []).map(
      (object) => object.id,
    );
    const blueprintAssociationIds = (
      moduleWithBlueprints.blueprintAssociations ?? []
    ).map((association) => association.id);

    const objectTypeRepo = this.dataSource.getRepository(CrmObjectType);
    const associationTypeRepo = this.dataSource.getRepository(CrmAssociationType);

    const [objectTypes, associationTypes] = await Promise.all([
      blueprintObjectIds.length
        ? objectTypeRepo.find({
            where: {
              company: { id: companyId },
              templateOriginId: In(blueprintObjectIds),
            },
          })
        : Promise.resolve([]),
      blueprintAssociationIds.length
        ? associationTypeRepo.find({
            where: {
              company: { id: companyId },
              templateOriginId: In(blueprintAssociationIds),
            },
          })
        : Promise.resolve([]),
    ]);

    const objectTypeIds = objectTypes.map((objectType) => objectType.id);
    const associationTypeIds = associationTypes.map((association) => association.id);
    const objectRepo = this.dataSource.getRepository(CrmObject);
    const objectCount = objectTypeIds.length
      ? await objectRepo.count({
          where: {
            company: { id: companyId },
            objectType: { id: In(objectTypeIds) },
          },
        })
      : 0;

    if (objectCount > 0 && !force) {
      return {
        message: `Module '${moduleSlug}' has ${objectCount} CRM objects. Confirm uninstall to proceed.`,
        deletedCount: objectCount,
      };
    }

    await this.dataSource.transaction(async (manager) => {
      const assocRepo = manager.getRepository(CrmObjectAssociation);
      const objectRepoTx = manager.getRepository(CrmObject);
      const associationTypeRepo = manager.getRepository(CrmAssociationType);
      const objectFieldRepo = manager.getRepository(CrmObjectField);
      const objectTypeRepoTx = manager.getRepository(CrmObjectType);
      const installedModuleRepo = manager.getRepository(CompanyInstalledModule);

      const objectIds = objectTypeIds.length
        ? await objectRepoTx
            .createQueryBuilder('object')
            .select('object.id', 'id')
            .where('object.companyId = :companyId', { companyId })
            .andWhere('object.objectTypeId IN (:...objectTypeIds)', { objectTypeIds })
            .getRawMany()
        : [];

      const objectIdList = objectIds.map((row) => row.id).filter(Boolean);

      if (associationTypeIds.length > 0 || objectIdList.length > 0) {
        const deleteAssocQuery = assocRepo
          .createQueryBuilder()
          .delete()
          .from(CrmObjectAssociation)
          .where('companyId = :companyId', { companyId })
          .andWhere(
            new Brackets((qb) => {
              if (associationTypeIds.length > 0) {
                qb.where('typeId IN (:...associationTypeIds)', {
                  associationTypeIds,
                });
              }

              if (objectIdList.length > 0) {
                if (associationTypeIds.length > 0) {
                  qb.orWhere('sourceObjectId IN (:...objectIds)', {
                    objectIds: objectIdList,
                  }).orWhere('targetObjectId IN (:...objectIds)', {
                    objectIds: objectIdList,
                  });
                } else {
                  qb.where('sourceObjectId IN (:...objectIds)', {
                    objectIds: objectIdList,
                  }).orWhere('targetObjectId IN (:...objectIds)', {
                    objectIds: objectIdList,
                  });
                }
              }
            }),
          );
        await deleteAssocQuery.execute();
      }

      if (objectTypeIds.length > 0) {
        await objectRepoTx
          .createQueryBuilder()
          .delete()
          .from(CrmObject)
          .where('companyId = :companyId', { companyId })
          .andWhere('objectTypeId IN (:...objectTypeIds)', { objectTypeIds })
          .execute();

        await objectFieldRepo
          .createQueryBuilder()
          .delete()
          .from(CrmObjectField)
          .where('companyId = :companyId', { companyId })
          .andWhere('objectTypeId IN (:...objectTypeIds)', { objectTypeIds })
          .execute();

        await objectTypeRepoTx
          .createQueryBuilder()
          .delete()
          .from(CrmObjectType)
          .where('companyId = :companyId', { companyId })
          .andWhere('id IN (:...objectTypeIds)', { objectTypeIds })
          .execute();
      }

      if (blueprintAssociationIds.length > 0) {
        await associationTypeRepo
          .createQueryBuilder()
          .delete()
          .from(CrmAssociationType)
          .where('companyId = :companyId', { companyId })
          .andWhere('templateOriginId IN (:...associationOriginIds)', {
            associationOriginIds: blueprintAssociationIds,
          })
          .execute();
      }

      await installedModuleRepo
        .createQueryBuilder()
        .delete()
        .from(CompanyInstalledModule)
        .where('companyId = :companyId', { companyId })
        .andWhere('moduleId = :moduleId', { moduleId: module.id })
        .execute();
    });

    return {
      message: `Module '${moduleSlug}' uninstalled successfully.`,
      deletedCount: objectCount,
    };
  }

  async getCompanyInstallation(
    companyId: string,
  ): Promise<CompanyTemplateInstallationResponseDto> {
    const companyTemplate = await this.companyTemplateRepository.findByCompanyId(
      companyId,
    );
    const installedModules = await this.companyInstalledModuleRepository.findByCompanyId(
      companyId,
    );

    const template = companyTemplate?.template
      ? {
          id: companyTemplate.template.id,
          name: companyTemplate.template.name,
          slug: companyTemplate.template.slug,
          description: companyTemplate.template.description ?? null,
          icon: companyTemplate.template.icon ?? null,
        }
      : null;

    const modules = installedModules
      .map((installed) => installed.module)
      .filter((module): module is NonNullable<typeof module> => Boolean(module))
      .map((module) => ({
        id: module.id,
        name: module.name,
        slug: module.slug,
        description: module.description ?? null,
        isCore: module.isCore,
        displayOrder: module.displayOrder,
      }));

    return {
      template,
      modules,
    };
  }

  private selectModules(
    template: CrmTemplate,
    requestedSlugs: string[] | undefined,
    installAllModules: boolean,
  ): CrmTemplateModule[] {
    const modules = template.modules ?? [];
    if (installAllModules) {
      return modules;
    }

    const requested = requestedSlugs ?? [];
    const requestedSet = new Set(requested);
    const missingSlugs = requested.filter(
      (slug) => !modules.some((module) => module.slug === slug),
    );

    if (missingSlugs.length > 0) {
      throw new NotFoundException(
        `Module slug(s) not found: ${missingSlugs.join(', ')}`,
      );
    }

    const coreModules = modules.filter((module) => module.isCore);
    const selected = [...coreModules];
    for (const module of modules) {
      if (requestedSet.has(module.slug) && !selected.some((m) => m.slug === module.slug)) {
        selected.push(module);
      }
    }

    return selected;
  }

  private ensureBlueprintApiNamesUnique(modules: CrmTemplateModule[]): void {
    const seen = new Set<string>();
    const duplicates = new Set<string>();

    for (const module of modules) {
      for (const object of module.blueprintObjects ?? []) {
        if (seen.has(object.apiName)) {
          duplicates.add(object.apiName);
        } else {
          seen.add(object.apiName);
        }
      }
    }

    if (duplicates.size > 0) {
      throw new BadRequestException(
        `Duplicate blueprint object apiName values: ${Array.from(duplicates).join(', ')}`,
      );
    }
  }

  private validateModuleDependencies(modules: CrmTemplateModule[]): void {
    const selectedSlugs = new Set(modules.map((module) => module.slug));

    const missingDependencies: string[] = [];
    for (const module of modules) {
      for (const dependency of module.dependsOn ?? []) {
        if (!selectedSlugs.has(dependency)) {
          missingDependencies.push(`${module.slug} -> ${dependency}`);
        }
      }
    }

    if (missingDependencies.length > 0) {
      throw new BadRequestException(
        `Missing module dependencies: ${missingDependencies.join(', ')}`,
      );
    }
  }

  private validateModuleConflicts(modules: CrmTemplateModule[]): void {
    const selectedSlugs = new Set(modules.map((module) => module.slug));

    const conflicts: string[] = [];
    for (const module of modules) {
      for (const conflict of module.conflictsWith ?? []) {
        if (selectedSlugs.has(conflict)) {
          conflicts.push(`${module.slug} x ${conflict}`);
        }
      }
    }

    if (conflicts.length > 0) {
      throw new BadRequestException(
        `Module conflicts detected: ${conflicts.join(', ')}`,
      );
    }
  }

  private sortModulesByDependencies(modules: CrmTemplateModule[]): CrmTemplateModule[] {
    const moduleBySlug = new Map(modules.map((module) => [module.slug, module]));
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();

    for (const module of modules) {
      inDegree.set(module.slug, 0);
      dependents.set(module.slug, []);
    }

    for (const module of modules) {
      for (const dependency of module.dependsOn ?? []) {
        if (!moduleBySlug.has(dependency)) {
          throw new BadRequestException(
            `Dependency '${dependency}' for module '${module.slug}' is not selected.`,
          );
        }
        inDegree.set(module.slug, (inDegree.get(module.slug) ?? 0) + 1);
        dependents.get(dependency)?.push(module.slug);
      }
    }

    const queue = modules
      .filter((module) => (inDegree.get(module.slug) ?? 0) === 0)
      .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name));

    const ordered: CrmTemplateModule[] = [];

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) {
        break;
      }
      ordered.push(current);

      for (const dependent of dependents.get(current.slug) ?? []) {
        const nextDegree = (inDegree.get(dependent) ?? 0) - 1;
        inDegree.set(dependent, nextDegree);
        if (nextDegree === 0) {
          const dependentModule = moduleBySlug.get(dependent);
          if (dependentModule) {
            queue.push(dependentModule);
            queue.sort(
              (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
            );
          }
        }
      }
    }

    if (ordered.length !== modules.length) {
      throw new BadRequestException('Circular module dependencies detected.');
    }

    return ordered;
  }

  private collectRequiredApiNames(module: CrmTemplateModule): string[] {
    const apiNames = new Set<string>();

    for (const object of module.blueprintObjects ?? []) {
      apiNames.add(object.apiName);
    }

    for (const association of module.blueprintAssociations ?? []) {
      apiNames.add(association.sourceObjectApiName);
      apiNames.add(association.targetObjectApiName);
    }

    return Array.from(apiNames);
  }

  private async installModules(params: {
    companyId: string;
    modules: CrmTemplateModule[];
    objectTypeIdByApiName: Map<string, string>;
    objectTypeRepo: Repository<CrmObjectType>;
    objectFieldRepo: Repository<CrmObjectField>;
    associationTypeRepo: Repository<CrmAssociationType>;
    installedModuleRepo: Repository<CompanyInstalledModule>;
  }): Promise<{ createdObjectTypes: number; createdFields: number; createdAssociations: number }> {
    const {
      companyId,
      modules,
      objectTypeIdByApiName,
      objectTypeRepo,
      objectFieldRepo,
      associationTypeRepo,
      installedModuleRepo,
    } = params;

    let createdObjectTypes = 0;
    let createdFields = 0;
    let createdAssociations = 0;

    for (const module of modules) {
      const objects = [...(module.blueprintObjects ?? [])].sort(
        (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
      );

      for (const blueprintObject of objects) {
        const objectType = objectTypeRepo.create({
          company: { id: companyId },
          name: blueprintObject.name,
          apiName: blueprintObject.apiName,
          description: blueprintObject.description,
          templateOriginId: blueprintObject.id,
          protection: blueprintObject.protection,
        });

        const savedObjectType = await objectTypeRepo.save(objectType);
        objectTypeIdByApiName.set(blueprintObject.apiName, savedObjectType.id);
        createdObjectTypes += 1;

        const fields = [...(blueprintObject.fields ?? [])].sort(
          (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
        );

        if (fields.length > 0) {
          const fieldEntities = fields.map((field) =>
            objectFieldRepo.create({
              company: { id: companyId },
              objectType: { id: savedObjectType.id },
              name: field.name,
              description: field.description,
              fieldType: field.fieldType,
              apiName: field.apiName,
              isRequired: field.isRequired ?? false,
              shape: field.shape,
              configShape: field.configShape,
              templateOriginId: field.id,
              protection: field.protection,
            }),
          );

          const savedFields = await objectFieldRepo.save(fieldEntities);
          createdFields += savedFields.length;
        }
      }

      const associations = [...(module.blueprintAssociations ?? [])].sort(
        (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
      );

      if (associations.length > 0) {
        const associationEntities = associations.map((association) => {
          const sourceId = objectTypeIdByApiName.get(association.sourceObjectApiName);
          const targetId = objectTypeIdByApiName.get(association.targetObjectApiName);

          if (!sourceId || !targetId) {
            throw new BadRequestException(
              `Association '${association.apiName}' references missing object types.`,
            );
          }

          return associationTypeRepo.create({
            company: { id: companyId },
            name: association.name,
            apiName: association.apiName,
            description: association.description,
            isBidirectional: association.isBidirectional ?? true,
            reverseName: association.reverseName,
            sourceObjectType: { id: sourceId },
            targetObjectType: { id: targetId },
            sourceCardinality: association.sourceCardinality,
            targetCardinality: association.targetCardinality,
            templateOriginId: association.id,
            protection: association.protection,
          });
        });

        const savedAssociations = await associationTypeRepo.save(associationEntities);
        createdAssociations += savedAssociations.length;
      }

      const installedModule = installedModuleRepo.create({
        companyId,
        moduleId: module.id,
      });
      await installedModuleRepo.save(installedModule);
    }

    return { createdObjectTypes, createdFields, createdAssociations };
  }
}
