import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CrmTemplateModule } from '../../../entities/template/crm-template-module.entity';
import { CompanyInstalledModule } from '../../../entities/template/company-installed-module.entity';
import { CreateTemplateModuleDto } from '../../../admin/templates/modules/dto/requests/create-template-module.dto';
import { UpdateTemplateModuleDto } from '../../../admin/templates/modules/dto/requests/update-template-module.dto';

@Injectable()
export class CrmTemplateModuleRepository extends Repository<CrmTemplateModule> {
  constructor(private readonly dataSource: DataSource) {
    super(CrmTemplateModule, dataSource.createEntityManager());
  }

  async findByTemplateId(templateId: string): Promise<CrmTemplateModule[]> {
    return this.createQueryBuilder('module')
      .where('module.templateId = :templateId', { templateId })
      .orderBy('module.displayOrder', 'ASC')
      .addOrderBy('module.name', 'ASC')
      .getMany();
  }

  async findBySlug(
    templateId: string,
    slug: string,
  ): Promise<CrmTemplateModule | null> {
    return this.findOne({ where: { templateId, slug } });
  }

  async findWithBlueprints(moduleId: string): Promise<CrmTemplateModule> {
    const module = await this.createQueryBuilder('module')
      .leftJoinAndSelect('module.blueprintObjects', 'blueprintObject')
      .leftJoinAndSelect('blueprintObject.fields', 'blueprintField')
      .leftJoinAndSelect('module.blueprintAssociations', 'blueprintAssociation')
      .where('module.id = :moduleId', { moduleId })
      .getOne();

    if (!module) {
      throw new NotFoundException(`CRM template module with ID '${moduleId}' not found`);
    }

    return module;
  }

  async isSlugAvailable(
    templateId: string,
    slug: string,
    excludeId?: string,
  ): Promise<boolean> {
    const query = this.createQueryBuilder('module')
      .where('module.templateId = :templateId', { templateId })
      .andWhere('module.slug = :slug', { slug });

    if (excludeId) {
      query.andWhere('module.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count === 0;
  }

  async createModule(dto: CreateTemplateModuleDto): Promise<CrmTemplateModule> {
    const slugAvailable = await this.isSlugAvailable(dto.templateId, dto.slug);
    if (!slugAvailable) {
      throw new ConflictException(`Module slug '${dto.slug}' already exists for this template`);
    }

    const module = this.create({
      templateId: dto.templateId,
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      isCore: dto.isCore ?? false,
      dependsOn: dto.dependsOn ?? [],
      conflictsWith: dto.conflictsWith ?? [],
      displayOrder: dto.displayOrder ?? 0,
    });

    return this.save(module);
  }

  async updateModule(id: string, dto: UpdateTemplateModuleDto): Promise<void> {
    const module = await this.findOne({ where: { id } });
    if (!module) {
      throw new NotFoundException(`CRM template module with ID '${id}' not found`);
    }

    if (dto.name !== undefined) module.name = dto.name;
    if (dto.description !== undefined) module.description = dto.description;
    if (dto.isCore !== undefined) module.isCore = dto.isCore;
    if (dto.dependsOn !== undefined) module.dependsOn = dto.dependsOn;
    if (dto.conflictsWith !== undefined) module.conflictsWith = dto.conflictsWith;
    if (dto.displayOrder !== undefined) module.displayOrder = dto.displayOrder;

    await this.save(module);
  }

  async deleteModule(id: string): Promise<void> {
    const module = await this.findOne({ where: { id } });
    if (!module) {
      throw new NotFoundException(`CRM template module with ID '${id}' not found`);
    }

    const installedCount = await this.manager
      .getRepository(CompanyInstalledModule)
      .createQueryBuilder('installedModule')
      .where('installedModule.moduleId = :moduleId', { moduleId: id })
      .getCount();

    if (installedCount > 0) {
      throw new BadRequestException(
        'Cannot delete template module while companies have it installed.',
      );
    }

    await this.remove(module);
  }

  async reorderModules(templateId: string, orderedIds: string[]): Promise<void> {
    if (!orderedIds.length) {
      return;
    }

    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      throw new BadRequestException('Duplicate module IDs provided for reorder.');
    }

    const matchingCount = await this.createQueryBuilder('module')
      .where('module.templateId = :templateId', { templateId })
      .andWhere('module.id IN (:...orderedIds)', { orderedIds })
      .getCount();

    if (matchingCount !== orderedIds.length) {
      throw new BadRequestException('One or more modules do not belong to the template.');
    }

    await this.manager.transaction(async (manager) => {
      const repo = manager.getRepository(CrmTemplateModule);
      await Promise.all(
        orderedIds.map((id, index) =>
          repo.update({ id }, { displayOrder: index }),
        ),
      );
    });
  }
}
