import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CrmTemplateBlueprintField } from '../../../entities/template/crm-template-blueprint-field.entity';
import { CreateBlueprintFieldDto } from '../../../admin/templates/blueprint-fields/dto/requests/create-blueprint-field.dto';
import { UpdateBlueprintFieldDto } from '../../../admin/templates/blueprint-fields/dto/requests/update-blueprint-field.dto';
import { FieldType } from '../../../client/object-related/crm-object-field/field-types/field-type.enum';
import { FieldRegistry } from '../../../client/object-related/crm-object-field/field-types';
import { PrimitiveValueType } from '../../../client/object-related/crm-object-field/formula/primitive-value-type.enum';
import { validateAndNormalizeFieldConfig } from '../../../client/object-related/crm-object-field/field-types/validate-field-config';
import { normalizeFormulaConfig } from '../../../client/object-related/crm-object-field/formula/normalize-formula-config';
import { TemplateErrorCode } from '../../../enums/template/template-error-code.enum';
import { TemplateItemProtection } from '../../../enums/template/template-item-protection.enum';
import { isUUID } from 'class-validator';
import { NormalizeFormulaDto } from '../../../admin/templates/blueprint-fields/dto/requests/normalize-formula.dto';
import { NormalizeFormulaResponseDto } from '../../../admin/templates/blueprint-fields/dto/responses/normalize-formula-response.dto';
import { GetFormulaContextResponseDto } from '../../../admin/templates/blueprint-fields/dto/responses/get-formula-context-response.dto';

const TEMPLATE_API_NAME_REGEX = /^_[a-z][a-z0-9_]*$/;

const isValidFieldType = (value: FieldType): boolean =>
  Object.values(FieldType).includes(value as FieldType);

const MAX_FIELDS_PER_OBJECT = 200;
const MAX_BULK_FIELDS = 50;

const requiresOptions = (fieldType: FieldType): boolean =>
  fieldType === FieldType.SELECT || fieldType === FieldType.MULTI_SELECT;

@Injectable()
export class CrmTemplateBlueprintFieldRepository extends Repository<CrmTemplateBlueprintField> {
  constructor(private readonly dataSource: DataSource) {
    super(CrmTemplateBlueprintField, dataSource.createEntityManager());
  }

  /**
   * Maps field types to their primitive value types for formula context
   */
  private primitiveValueTypeForFieldType(fieldType: FieldType): PrimitiveValueType {
    const mapping: Partial<Record<FieldType, PrimitiveValueType>> = {
      [FieldType.NUMBER]: PrimitiveValueType.NUMBER,
      [FieldType.CURRENCY]: PrimitiveValueType.NUMBER,
      [FieldType.STRING]: PrimitiveValueType.STRING,
      [FieldType.SELECT]: PrimitiveValueType.STRING,
      [FieldType.BOOLEAN]: PrimitiveValueType.BOOLEAN,
      [FieldType.DATE]: PrimitiveValueType.DATE,
      [FieldType.DATETIME]: PrimitiveValueType.DATETIME,
      [FieldType.FORMULA]: PrimitiveValueType.ANY,
    };
    return mapping[fieldType] ?? PrimitiveValueType.ANY;
  }

  /**
   * Get formula context for a blueprint object (sibling fields that can be used in formulas)
   */
  async getFormulaContext(objectId: string): Promise<GetFormulaContextResponseDto> {
    const fields = await this.find({
      where: { blueprintObjectId: objectId },
    });

    const usableFields = fields
      .filter((field) => {
        if (!field.apiName) return false;
        const meta = FieldRegistry[field.fieldType];
        return meta?.isUsableInFormula === true;
      })
      .map((field) => ({
        id: field.id,
        apiName: field.apiName,
        name: field.name,
        fieldType: field.fieldType,
        primitiveType: this.primitiveValueTypeForFieldType(field.fieldType),
      }));

    const fieldTypes: Record<string, PrimitiveValueType> = {};
    usableFields.forEach((field) => {
      fieldTypes[field.apiName] = field.primitiveType;
    });

    return {
      blueprintObjectId: objectId,
      fields: usableFields,
      fieldTypes,
    };
  }

  /**
   * Normalize and validate a formula expression tree for blueprint context
   */
  async normalizeFormula(dto: NormalizeFormulaDto): Promise<NormalizeFormulaResponseDto> {
    const { fieldTypes } = await this.getFormulaContext(dto.blueprintObjectId);
    const { FormulaCategory } = await import('../../../client/object-related/crm-object-field/formula/formula-category.enum');

    const { config, errors } = normalizeFormulaConfig({
      expressionTree: dto.expressionTree as any,
      category: dto.category ? (dto.category as typeof FormulaCategory[keyof typeof FormulaCategory]) : undefined,
      fieldTypes,
    });

    return {
      valid: errors.length === 0,
      errors,
      normalized: config,
    };
  }

  async findByObjectId(objectId: string): Promise<CrmTemplateBlueprintField[]> {
    return this.createQueryBuilder('field')
      .where('field.blueprintObjectId = :objectId', { objectId })
      .orderBy('field.displayOrder', 'ASC')
      .addOrderBy('field.name', 'ASC')
      .getMany();
  }

  async isApiNameAvailable(
    objectId: string,
    apiName: string,
    excludeId?: string,
  ): Promise<boolean> {
    const query = this.createQueryBuilder('field')
      .where('field.blueprintObjectId = :objectId', { objectId })
      .andWhere('field.apiName = :apiName', { apiName });

    if (excludeId) {
      query.andWhere('field.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count === 0;
  }

  async createField(
    dto: CreateBlueprintFieldDto,
  ): Promise<CrmTemplateBlueprintField> {
    // Validate apiName format (must start with _ for template-managed fields)
    if (!TEMPLATE_API_NAME_REGEX.test(dto.apiName)) {
      throw new BadRequestException(
        'apiName must start with "_" and use lowercase snake_case',
      );
    }

    // Validate field type
    if (!isValidFieldType(dto.fieldType)) {
      throw new BadRequestException(TemplateErrorCode.INVALID_FIELD_TYPE);
    }

    // Check max fields limit
    const existingFields = await this.count({ where: { blueprintObjectId: dto.blueprintObjectId } });
    if (existingFields >= MAX_FIELDS_PER_OBJECT) {
      throw new BadRequestException(TemplateErrorCode.MAX_FIELDS_EXCEEDED);
    }

    // Check apiName uniqueness
    const apiNameAvailable = await this.isApiNameAvailable(
      dto.blueprintObjectId,
      dto.apiName,
    );
    if (!apiNameAvailable) {
      throw new ConflictException(TemplateErrorCode.FIELD_API_NAME_TAKEN);
    }

    // Get formula context if this is a formula field
    const formulaFieldTypes =
      dto.fieldType === FieldType.FORMULA && dto.configShape
        ? (await this.getFormulaContext(dto.blueprintObjectId)).fieldTypes
        : undefined;

    // Validate and normalize field configuration using same logic as CRM object fields
    const { normalizedConfigShape } = validateAndNormalizeFieldConfig({
      fieldType: dto.fieldType,
      shape: dto.shape,
      configShape: dto.configShape,
      formulaFieldTypes,
    });

    const field = this.create({
      blueprintObjectId: dto.blueprintObjectId,
      name: dto.name,
      apiName: dto.apiName,
      fieldType: dto.fieldType,
      description: dto.description,
      isRequired: dto.isRequired ?? false,
      shape: dto.shape,
      protection: dto.protection,
      displayOrder: dto.displayOrder ?? 0,
    });

    // Use normalized configShape if available
    if (normalizedConfigShape !== undefined) {
      field.configShape = normalizedConfigShape;
    } else if (dto.configShape) {
      field.configShape = dto.configShape;
    }

    return this.save(field);
  }

  async updateField(id: string, dto: UpdateBlueprintFieldDto): Promise<void> {
    const field = await this.findOne({ where: { id } });
    if (!field) {
      throw new NotFoundException(
        `CRM template blueprint field with ID '${id}' not found`,
      );
    }

    if (field.protection === TemplateItemProtection.FULL) {
      throw new ForbiddenException(
        'This field is protected and cannot be modified.',
      );
    }

    if (dto.apiName && dto.apiName !== field.apiName) {
      throw new BadRequestException('apiName cannot be changed once set');
    }

    if (dto.fieldType !== undefined && dto.fieldType !== field.fieldType) {
      throw new BadRequestException('fieldType cannot be changed once set');
    }

    if (dto.fieldType !== undefined && !isValidFieldType(dto.fieldType)) {
      throw new BadRequestException('fieldType is invalid');
    }

    if (dto.name !== undefined) field.name = dto.name;
    if (dto.fieldType !== undefined) field.fieldType = dto.fieldType;
    if (dto.description !== undefined) field.description = dto.description;
    if (dto.isRequired !== undefined) field.isRequired = dto.isRequired;
    if (dto.shape !== undefined) field.shape = dto.shape;
    if (dto.configShape !== undefined) field.configShape = dto.configShape;
    if (dto.protection !== undefined) field.protection = dto.protection;
    if (dto.displayOrder !== undefined) field.displayOrder = dto.displayOrder;

    await this.save(field);
  }

  async deleteField(id: string): Promise<void> {
    const field = await this.findOne({ where: { id } });
    if (!field) {
      throw new NotFoundException(
        `CRM template blueprint field with ID '${id}' not found`,
      );
    }

    if (
      field.protection === TemplateItemProtection.FULL ||
      field.protection === TemplateItemProtection.DELETE_PROTECTED
    ) {
      throw new ForbiddenException('This field is protected and cannot be modified.');
    }

    await this.remove(field);
  }

  async reorderFields(objectId: string, orderedIds: string[]): Promise<void> {
    if (!orderedIds.length) {
      return;
    }

    for (const id of orderedIds) {
      if (!isUUID(id)) {
        throw new BadRequestException('Invalid blueprint field IDs provided for reorder.');
      }
    }

    const uniqueIds = new Set(orderedIds);
    if (uniqueIds.size !== orderedIds.length) {
      throw new BadRequestException('Duplicate blueprint field IDs provided for reorder.');
    }

    const matchingCount = await this.createQueryBuilder('field')
      .where('field.blueprintObjectId = :objectId', { objectId })
      .andWhere('field.id IN (:...orderedIds)', { orderedIds })
      .getCount();

    if (matchingCount !== orderedIds.length) {
      throw new BadRequestException(
        'One or more blueprint fields do not belong to the object.',
      );
    }

    await this.manager.transaction(async (manager) => {
      const repo = manager.getRepository(CrmTemplateBlueprintField);
      await Promise.all(
        orderedIds.map((id, index) =>
          repo.update({ id }, { displayOrder: index }),
        ),
      );
    });
  }

  async bulkCreateFields(
    objectId: string,
    fields: CreateBlueprintFieldDto[],
  ): Promise<CrmTemplateBlueprintField[]> {
    if (!fields.length) {
      throw new BadRequestException('fields array must not be empty');
    }

    if (fields.length > MAX_BULK_FIELDS) {
      throw new BadRequestException(TemplateErrorCode.BULK_LIMIT_EXCEEDED);
    }

    // Check for duplicate apiNames in the batch
    const apiNames = fields.map((field) => field.apiName);
    const uniqueApiNames = new Set(apiNames);
    if (uniqueApiNames.size !== apiNames.length) {
      throw new ConflictException(TemplateErrorCode.FIELD_API_NAME_TAKEN);
    }

    // Basic validation for each field
    for (const field of fields) {
      if (!TEMPLATE_API_NAME_REGEX.test(field.apiName)) {
        throw new BadRequestException(
          `apiName '${field.apiName}' must start with "_" and use lowercase snake_case`,
        );
      }

      if (!isValidFieldType(field.fieldType)) {
        throw new BadRequestException(TemplateErrorCode.INVALID_FIELD_TYPE);
      }

      if (field.blueprintObjectId && field.blueprintObjectId !== objectId) {
        throw new BadRequestException(
          'blueprintObjectId mismatch in bulk create payload.',
        );
      }
    }

    // Check max fields limit
    const existingFieldsCount = await this.count({
      where: { blueprintObjectId: objectId },
    });

    if (existingFieldsCount + fields.length > MAX_FIELDS_PER_OBJECT) {
      throw new BadRequestException(TemplateErrorCode.MAX_FIELDS_EXCEEDED);
    }

    // Check for existing apiNames in database
    const existingCount = await this.createQueryBuilder('field')
      .where('field.blueprintObjectId = :objectId', { objectId })
      .andWhere('field.apiName IN (:...apiNames)', { apiNames })
      .getCount();

    if (existingCount > 0) {
      throw new ConflictException(TemplateErrorCode.FIELD_API_NAME_TAKEN);
    }

    // Get formula context for validating formula fields
    const formulaContext = await this.getFormulaContext(objectId);

    // Validate and normalize each field's configuration
    const entities = fields.map((field) => {
      const formulaFieldTypes =
        field.fieldType === FieldType.FORMULA && field.configShape
          ? formulaContext.fieldTypes
          : undefined;

      const { normalizedConfigShape } = validateAndNormalizeFieldConfig({
        fieldType: field.fieldType,
        shape: field.shape,
        configShape: field.configShape,
        formulaFieldTypes,
      });

      const entity = this.create({
        blueprintObjectId: objectId,
        name: field.name,
        apiName: field.apiName,
        fieldType: field.fieldType,
        description: field.description,
        isRequired: field.isRequired ?? false,
        shape: field.shape,
        protection: field.protection,
        displayOrder: field.displayOrder ?? 0,
      });

      if (normalizedConfigShape !== undefined) {
        entity.configShape = normalizedConfigShape;
      } else if (field.configShape) {
        entity.configShape = field.configShape;
      }

      return entity;
    });

    return this.save(entities);
  }
}
