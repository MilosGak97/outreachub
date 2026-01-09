import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CrmTemplateBlueprintObject } from '../../../entities/template/crm-template-blueprint-object.entity';
import { CreateBlueprintObjectDto } from '../../../admin/templates/blueprint-objects/dto/requests/create-blueprint-object.dto';
import { UpdateBlueprintObjectDto } from '../../../admin/templates/blueprint-objects/dto/requests/update-blueprint-object.dto';
import { TemplateItemProtection } from '../../../enums/template/template-item-protection.enum';

const TEMPLATE_API_NAME_REGEX = /^_[a-z][a-z0-9_]*$/;

@Injectable()
export class CrmTemplateBlueprintObjectRepository extends Repository<CrmTemplateBlueprintObject> {
  constructor(private readonly dataSource: DataSource) {
    super(CrmTemplateBlueprintObject, dataSource.createEntityManager());
  }

  async findByModuleId(moduleId: string): Promise<CrmTemplateBlueprintObject[]> {
    return this.createQueryBuilder('object')
      .leftJoinAndSelect('object.fields', 'field')
      .where('object.moduleId = :moduleId', { moduleId })
      .orderBy('object.displayOrder', 'ASC')
      .addOrderBy('object.name', 'ASC')
      .addOrderBy('field.displayOrder', 'ASC')
      .getMany();
  }

  async findByApiName(
    moduleId: string,
    apiName: string,
  ): Promise<CrmTemplateBlueprintObject | null> {
    return this.findOne({ where: { moduleId, apiName } });
  }

  async isApiNameAvailable(
    moduleId: string,
    apiName: string,
    excludeId?: string,
  ): Promise<boolean> {
    const query = this.createQueryBuilder('object')
      .where('object.moduleId = :moduleId', { moduleId })
      .andWhere('object.apiName = :apiName', { apiName });

    if (excludeId) {
      query.andWhere('object.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count === 0;
  }

  async createObject(
    dto: CreateBlueprintObjectDto,
  ): Promise<CrmTemplateBlueprintObject> {
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

    const blueprintObject = this.create({
      moduleId: dto.moduleId,
      name: dto.name,
      apiName: dto.apiName,
      description: dto.description,
      protection: dto.protection,
      displayOrder: dto.displayOrder ?? 0,
    });

    return this.save(blueprintObject);
  }

  async updateObject(id: string, dto: UpdateBlueprintObjectDto): Promise<void> {
    const blueprintObject = await this.findOne({ where: { id } });
    if (!blueprintObject) {
      throw new NotFoundException(
        `CRM template blueprint object with ID '${id}' not found`,
      );
    }

    if (blueprintObject.protection === TemplateItemProtection.FULL) {
      throw new ForbiddenException(
        'This object is protected and cannot be modified.',
      );
    }

    if (dto.name !== undefined) blueprintObject.name = dto.name;
    if (dto.description !== undefined) blueprintObject.description = dto.description;
    if (dto.protection !== undefined) blueprintObject.protection = dto.protection;
    if (dto.displayOrder !== undefined) blueprintObject.displayOrder = dto.displayOrder;

    await this.save(blueprintObject);
  }

  async findWithFields(id: string): Promise<CrmTemplateBlueprintObject | null> {
    return this.createQueryBuilder('object')
      .leftJoinAndSelect('object.fields', 'field')
      .where('object.id = :id', { id })
      .orderBy('field.displayOrder', 'ASC')
      .addOrderBy('field.name', 'ASC')
      .getOne();
  }

  async deleteObject(id: string): Promise<void> {
    const blueprintObject = await this.findOne({ where: { id } });
    if (!blueprintObject) {
      throw new NotFoundException(
        `CRM template blueprint object with ID '${id}' not found`,
      );
    }

    if (
      blueprintObject.protection === TemplateItemProtection.FULL ||
      blueprintObject.protection === TemplateItemProtection.DELETE_PROTECTED
    ) {
      throw new ForbiddenException(
        'This object is protected and cannot be modified.',
      );
    }

    await this.remove(blueprintObject);
  }

  async reorderObjects(moduleId: string, orderedIds: string[]): Promise<void> {
    if (!orderedIds.length) {
      return;
    }

    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      throw new BadRequestException('Duplicate blueprint object IDs provided for reorder.');
    }

    const matchingCount = await this.createQueryBuilder('object')
      .where('object.moduleId = :moduleId', { moduleId })
      .andWhere('object.id IN (:...orderedIds)', { orderedIds })
      .getCount();

    if (matchingCount !== orderedIds.length) {
      throw new BadRequestException(
        'One or more blueprint objects do not belong to the module.',
      );
    }

    await this.manager.transaction(async (manager) => {
      const repo = manager.getRepository(CrmTemplateBlueprintObject);
      await Promise.all(
        orderedIds.map((id, index) =>
          repo.update({ id }, { displayOrder: index }),
        ),
      );
    });
  }
}
