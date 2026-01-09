import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, DataSource, Repository } from 'typeorm';
import { CrmTemplateBlueprintAssociation } from '../../../entities/template/crm-template-blueprint-association.entity';
import { CrmTemplateBlueprintObject } from '../../../entities/template/crm-template-blueprint-object.entity';
import { CrmTemplateModule } from '../../../entities/template/crm-template-module.entity';
import { TemplateItemProtection } from '../../../enums/template/template-item-protection.enum';
import { CreateBlueprintAssociationDto } from '../../../admin/templates/blueprint-associations/dto/requests/create-blueprint-association.dto';
import { UpdateBlueprintAssociationDto } from '../../../admin/templates/blueprint-associations/dto/requests/update-blueprint-association.dto';

const TEMPLATE_API_NAME_REGEX = /^_[a-z][a-z0-9_]*$/;

@Injectable()
export class CrmTemplateBlueprintAssociationRepository extends Repository<CrmTemplateBlueprintAssociation> {
  constructor(private readonly dataSource: DataSource) {
    super(CrmTemplateBlueprintAssociation, dataSource.createEntityManager());
  }

  async findByModuleId(moduleId: string): Promise<CrmTemplateBlueprintAssociation[]> {
    return this.createQueryBuilder('association')
      .where('association.moduleId = :moduleId', { moduleId })
      .orderBy('association.displayOrder', 'ASC')
      .addOrderBy('association.name', 'ASC')
      .getMany();
  }

  async isApiNameAvailable(
    moduleId: string,
    apiName: string,
    excludeId?: string,
  ): Promise<boolean> {
    const query = this.createQueryBuilder('association')
      .where('association.moduleId = :moduleId', { moduleId })
      .andWhere('association.apiName = :apiName', { apiName });

    if (excludeId) {
      query.andWhere('association.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count === 0;
  }

  async validateObjectApiNames(
    templateId: string,
    sourceApiName: string,
    targetApiName: string,
  ): Promise<boolean> {
    const apiNames = Array.from(new Set([sourceApiName, targetApiName]));
    const count = await this.manager
      .getRepository(CrmTemplateBlueprintObject)
      .createQueryBuilder('object')
      .innerJoin('object.module', 'module')
      .where('module.templateId = :templateId', { templateId })
      .andWhere('object.apiName IN (:...apiNames)', { apiNames })
      .getCount();

    return count === apiNames.length;
  }

  private async ensureAssociationPairUnique(
    moduleId: string,
    sourceObjectApiName: string,
    targetObjectApiName: string,
  ): Promise<void> {
    const count = await this.createQueryBuilder('association')
      .where('association.moduleId = :moduleId', { moduleId })
      .andWhere(
        new Brackets((qb) =>
          qb
            .where(
              'association.sourceObjectApiName = :source AND association.targetObjectApiName = :target',
              { source: sourceObjectApiName, target: targetObjectApiName },
            )
            .orWhere(
              'association.sourceObjectApiName = :target AND association.targetObjectApiName = :source',
              { source: sourceObjectApiName, target: targetObjectApiName },
            ),
        ),
      )
      .getCount();

    if (count > 0) {
      throw new ConflictException('An association between these objects already exists');
    }
  }

  async createAssociation(
    dto: CreateBlueprintAssociationDto,
  ): Promise<CrmTemplateBlueprintAssociation> {
    if (!TEMPLATE_API_NAME_REGEX.test(dto.apiName)) {
      throw new BadRequestException(
        'apiName must start with "_" and use lowercase snake_case',
      );
    }

    const apiNameAvailable = await this.isApiNameAvailable(dto.moduleId, dto.apiName);
    if (!apiNameAvailable) {
      throw new ConflictException(
        `apiName '${dto.apiName}' already exists for this module`,
      );
    }

    const module = await this.manager
      .getRepository(CrmTemplateModule)
      .findOne({ where: { id: dto.moduleId } });
    if (!module) {
      throw new NotFoundException(`CRM template module with ID '${dto.moduleId}' not found`);
    }

    await this.ensureAssociationPairUnique(
      dto.moduleId,
      dto.sourceObjectApiName,
      dto.targetObjectApiName,
    );

    const apiNamesValid = await this.validateObjectApiNames(
      module.templateId,
      dto.sourceObjectApiName,
      dto.targetObjectApiName,
    );
    if (!apiNamesValid) {
      throw new BadRequestException(
        'Source or target object apiName does not exist in the template.',
      );
    }

    const association = this.create({
      moduleId: dto.moduleId,
      name: dto.name,
      apiName: dto.apiName,
      sourceObjectApiName: dto.sourceObjectApiName,
      targetObjectApiName: dto.targetObjectApiName,
      sourceCardinality: dto.sourceCardinality,
      targetCardinality: dto.targetCardinality,
      isBidirectional: dto.isBidirectional ?? true,
      reverseName: dto.reverseName,
      description: dto.description,
      protection: dto.protection,
      displayOrder: dto.displayOrder ?? 0,
    });

    return this.save(association);
  }

  async updateAssociation(
    id: string,
    dto: UpdateBlueprintAssociationDto,
  ): Promise<void> {
    const association = await this.findOne({ where: { id } });
    if (!association) {
      throw new NotFoundException(
        `CRM template blueprint association with ID '${id}' not found`,
      );
    }

    if (association.protection === TemplateItemProtection.FULL) {
      throw new ForbiddenException('This association is protected and cannot be modified');
    }

    if (
      dto.sourceObjectApiName !== undefined &&
      dto.sourceObjectApiName !== association.sourceObjectApiName
    ) {
      throw new BadRequestException('sourceObjectApiName cannot be changed');
    }

    if (
      dto.targetObjectApiName !== undefined &&
      dto.targetObjectApiName !== association.targetObjectApiName
    ) {
      throw new BadRequestException('targetObjectApiName cannot be changed');
    }

    if (
      dto.sourceCardinality !== undefined &&
      dto.sourceCardinality !== association.sourceCardinality
    ) {
      throw new BadRequestException('sourceCardinality cannot be changed');
    }

    if (
      dto.targetCardinality !== undefined &&
      dto.targetCardinality !== association.targetCardinality
    ) {
      throw new BadRequestException('targetCardinality cannot be changed');
    }

    if (dto.apiName && dto.apiName !== association.apiName) {
      if (!TEMPLATE_API_NAME_REGEX.test(dto.apiName)) {
        throw new BadRequestException(
          'apiName must start with "_" and use lowercase snake_case',
        );
      }

      const apiNameAvailable = await this.isApiNameAvailable(
        association.moduleId,
        dto.apiName,
        id,
      );
      if (!apiNameAvailable) {
        throw new ConflictException(
          `apiName '${dto.apiName}' already exists for this module`,
        );
      }
    }

    if (dto.sourceObjectApiName !== undefined || dto.targetObjectApiName !== undefined) {
      const module = await this.manager
        .getRepository(CrmTemplateModule)
        .findOne({ where: { id: association.moduleId } });
      if (!module) {
        throw new NotFoundException(
          `CRM template module with ID '${association.moduleId}' not found`,
        );
      }

      const sourceApiName = dto.sourceObjectApiName ?? association.sourceObjectApiName;
      const targetApiName = dto.targetObjectApiName ?? association.targetObjectApiName;
      const apiNamesValid = await this.validateObjectApiNames(
        module.templateId,
        sourceApiName,
        targetApiName,
      );
      if (!apiNamesValid) {
        throw new BadRequestException(
          'Source or target object apiName does not exist in the template.',
        );
      }
    }

    if (dto.name !== undefined) association.name = dto.name;
    if (dto.apiName !== undefined) association.apiName = dto.apiName;
    if (dto.sourceObjectApiName !== undefined)
      association.sourceObjectApiName = dto.sourceObjectApiName;
    if (dto.targetObjectApiName !== undefined)
      association.targetObjectApiName = dto.targetObjectApiName;
    if (dto.sourceCardinality !== undefined)
      association.sourceCardinality = dto.sourceCardinality;
    if (dto.targetCardinality !== undefined)
      association.targetCardinality = dto.targetCardinality;
    if (dto.isBidirectional !== undefined)
      association.isBidirectional = dto.isBidirectional;
    if (dto.reverseName !== undefined) association.reverseName = dto.reverseName;
    if (dto.description !== undefined) association.description = dto.description;
    if (dto.protection !== undefined) association.protection = dto.protection;
    if (dto.displayOrder !== undefined) association.displayOrder = dto.displayOrder;

    await this.save(association);
  }

  async deleteAssociation(id: string): Promise<void> {
    const association = await this.findOne({ where: { id } });
    if (!association) {
      throw new NotFoundException(
        `CRM template blueprint association with ID '${id}' not found`,
      );
    }

    if (association.protection === TemplateItemProtection.FULL) {
      throw new ForbiddenException('This association is protected and cannot be modified');
    }

    await this.remove(association);
  }
}
