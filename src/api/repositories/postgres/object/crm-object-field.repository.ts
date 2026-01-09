import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, QueryFailedError } from 'typeorm';
import { CrmObjectField } from '../../../entities/object/crm-object-field.entity';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { GetAllQueryDto } from '../../../client/object-related/crm-object-type/dto/get-all-query.dto';
import { ObjectFieldDto } from '../../../client/object-related/crm-object-type/dto/object-field.dto';
import {
  GetAllFieldsResponseDto
} from '../../../client/object-related/crm-object-field/dto/get-all-fields-response.dto';
import { CreateCrmObjectFieldDto } from '../../../client/object-related/crm-object-field/dto/create-crm-object-field.dto';
import { UpdateFormulaConfigDto } from '../../../client/object-related/crm-object-field/dto/update-formula-config.dto';
import { NormalizeFormulaDto } from '../../../client/object-related/crm-object-field/dto/normalize-formula.dto';
import { NormalizeFormulaResponseDto } from '../../../client/object-related/crm-object-field/dto/normalize-formula-response.dto';
import { GetFormulaContextResponseDto } from '../../../client/object-related/crm-object-field/dto/get-formula-context-response.dto';
import { FieldRegistry } from '../../../client/object-related/crm-object-field/field-types';
import { FieldType } from '../../../client/object-related/crm-object-field/field-types/field-type.enum';
import { PrimitiveValueType } from '../../../client/object-related/crm-object-field/formula/primitive-value-type.enum';
import { validateValueAgainstSchema } from '../../../client/object-related/crm-object-field/field-types/validate-value-against-schema';
import { normalizeFormulaConfig } from '../../../client/object-related/crm-object-field/formula/normalize-formula-config';
import { validateAndNormalizeFieldConfig } from '../../../client/object-related/crm-object-field/field-types/validate-field-config';
import { TemplateItemProtection } from '../../../enums/template/template-item-protection.enum';

@Injectable()
export class CrmObjectFieldRepository extends BaseCompanyRepository<CrmObjectField> {
  constructor(private readonly dataSource: DataSource, companyContext: CompanyContext) {
    super(CrmObjectField, dataSource, companyContext);
  }

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

  private async findObjectTypeOrThrow(
    id: string,
    message = `CRM object type '${id}' not found`,
  ): Promise<CrmObjectType> {
    const objectType = await this.manager.getRepository(CrmObjectType).findOne({
      where: {
        id,
        company: { id: this.companyContext.currentCompanyId },
      },
    });

    if (!objectType) {
      throw new NotFoundException(message);
    }

    return objectType;
  }

  async updateFieldById(
    id: string,
    dto: { name?: string; description?: string; isRequired?: boolean },
  ): Promise<void> {
    const field = await this.findOne({ where: { id } });

    if (!field) {
      throw new NotFoundException(`CRM object field with ID '${id}' not found`);
    }

    if (field.protection === TemplateItemProtection.FULL) {
      throw new ForbiddenException(
        'Cannot modify this field - it is fully protected by template',
      );
    }

    if (dto.name !== undefined) field.name = dto.name;
    if (dto.description !== undefined) field.description = dto.description;
    if (dto.isRequired !== undefined) field.isRequired = dto.isRequired;

    await this.save(field);
  }
  // start code below


  async checkApiName(apiName: string): Promise<boolean>  {
    // Validate API name format
    if (!/^[a-z][a-z0-9_]*$/.test(apiName)) {
      throw new BadRequestException('apiName must be lowercase snake_case');
    }

    // Check for duplicate apiName within company
    const exists = await this.existsBy({ apiName: apiName });
    if (exists) {
      return false
    }
    return true
  }

  async getFormulaContext(objectTypeId: string): Promise<GetFormulaContextResponseDto> {
    const fields = await this.find({
      where: {
        objectType: { id: objectTypeId },
      },
    });

    const usableFields = fields
      .filter((field) => {
        if (!field.apiName) return false;
        const meta = FieldRegistry[field.fieldType];
        return meta?.isUsableInFormula === true;
      })
      .map((field) => ({
        id: field.id,
        apiName: field.apiName!,
        name: field.name,
        fieldType: field.fieldType,
        primitiveType: this.primitiveValueTypeForFieldType(field.fieldType),
      }));

    const fieldTypes: Record<string, PrimitiveValueType> = {};
    usableFields.forEach((field) => {
      fieldTypes[field.apiName] = field.primitiveType;
    });

    return {
      objectTypeId,
      fields: usableFields,
      fieldTypes,
    };
  }

  async createField(dto: CreateCrmObjectFieldDto): Promise<CrmObjectField> {
    const objectType = await this.findObjectTypeOrThrow(dto.objectTypeId, 'Object type not found');

    const formulaFieldTypes =
      dto.fieldType === FieldType.FORMULA && dto.configShape
        ? (await this.getFormulaContext(dto.objectTypeId)).fieldTypes
        : undefined;

    const { normalizedConfigShape } = validateAndNormalizeFieldConfig({
      fieldType: dto.fieldType,
      shape: dto.shape,
      configShape: dto.configShape,
      formulaFieldTypes,
    });

    const field = this.create({
      name: dto.name,
      description: dto.description,
      fieldType: dto.fieldType,
      apiName: dto.apiName,
      isRequired: dto.isRequired ?? false,
      objectType,
    });

    if (dto.shape) {
      field.shape = dto.shape;
    }

    if (normalizedConfigShape !== undefined) {
      field.configShape = normalizedConfigShape;
    }

    if (dto.apiName !== undefined) {
      const existingApiName = await this.findOne({
        where: {
          apiName: dto.apiName,
        },
      });
      if (existingApiName) {
        throw new BadRequestException(`apiName: '${dto.apiName}' is already used in this company.`);
      }
    }

    return await this.save(field);
  }

  async updateFormulaConfig(id: string, dto: UpdateFormulaConfigDto): Promise<CrmObjectField> {
    const field = await this.findOne({
      where: { id },
      relations: {
        objectType: true,
      },
    });

    if (!field) {
      throw new NotFoundException('CRM object field not found');
    }

    if (field.fieldType !== FieldType.FORMULA) {
      throw new BadRequestException('Only formula fields can be updated via this endpoint.');
    }

    const objectTypeId = field.objectType?.id;
    if (!objectTypeId) {
      throw new BadRequestException('Formula field is missing objectType relation.');
    }

    const context = await this.getFormulaContext(objectTypeId);
    if (field.apiName) {
      delete context.fieldTypes[field.apiName];
    }

    const existingConfig = field.configShape ?? {};

    const { config, errors } = normalizeFormulaConfig({
      expressionTree: (dto.expressionTree ?? (existingConfig as any).expressionTree) as any,
      category: dto.category ?? (existingConfig as any).category,
      fieldTypes: context.fieldTypes,
    });

    if (!config || errors.length > 0) {
      throw new BadRequestException(`Invalid formula config: ${errors.join('; ')}`);
    }

    const configPayload = {
      category: config.category,
      expressionTree: config.expressionTree,
      dependsOnFields: config.dependsOnFields,
      schemaVersion: config.schemaVersion,
    };

    const fieldDef = FieldRegistry[FieldType.FORMULA];
    const isValidConfigShape = validateValueAgainstSchema(configPayload, fieldDef?.configShape);
    if (!isValidConfigShape) {
      throw new BadRequestException('Invalid configShape structure for this field type.');
    }

    field.configShape = configPayload;
    return await this.save(field);
  }

  async deleteFieldById(id: string): Promise<void> {
    const field = await this.findOne({ where: { id } });

    if (!field) {
      throw new NotFoundException('CRM object field not found');
    }

    if (
      field.protection === TemplateItemProtection.FULL ||
      field.protection === TemplateItemProtection.DELETE_PROTECTED
    ) {
      throw new ForbiddenException(
        'Cannot delete this field - it is protected by template',
      );
    }

    await this.remove(field);
  }

  async normalizeFormula(dto: NormalizeFormulaDto): Promise<NormalizeFormulaResponseDto> {
    const { fieldTypes } = await this.getFormulaContext(dto.objectTypeId);

    const { config, errors } = normalizeFormulaConfig({
      expressionTree: dto.expressionTree as any,
      category: dto.category,
      fieldTypes,
    });

    return {
      valid: errors.length === 0,
      errors,
      normalized: config,
    };
  }


  async getFieldsByObjectType(objectTypeId: string, dto:GetAllQueryDto):Promise<GetAllFieldsResponseDto>{
    await this.findObjectTypeOrThrow(objectTypeId);

    try {
      const { limit, offset, searchQuery, fieldType } = dto;

      const limitNumber = Number(limit);
      const offsetNumber = Number(offset);

      const query = this.createQueryBuilder('item');
      const companyId = this.companyContext.currentCompanyId;

      // Always filter by company
      query.andWhere('item.companyId = :companyId', { companyId });
      query.andWhere('item.objectTypeId = :objectTypeId', { objectTypeId });

      if (searchQuery) {
        query.andWhere(
          '(item.name ILIKE :searchQuery OR item.api_name ILIKE :searchQuery)',
          { searchQuery: `%${searchQuery}%` },
        );
      }

      if (fieldType?.length) {
        query.andWhere('item.fieldType IN (:...fieldTypes)', { fieldTypes: fieldType });
      }

      query.orderBy('item.name', 'ASC');

      query.take(limitNumber);
      query.skip(offsetNumber);

      const [records, totalRecords] = await query.getManyAndCount();

      const result: ObjectFieldDto[] = records.map(
        ({ id, name, apiName, description, isRequired, fieldType  }) => ({
          id:    id ?? '/',
          name:  name ?? '/',
          apiName: apiName ?? '/',
          description: description ?? undefined,
          isRequired: isRequired ?? false,
          fieldType: fieldType
        }),
      );

      const currentPage = Math.floor(offset / limitNumber) + 1;
      const totalPages = Math.ceil(totalRecords / limitNumber);

      return {
        result,
        totalRecords,
        currentPage,
        totalPages,
        limit: limitNumber,
        offset: offsetNumber,
      };
    } catch (error) {
      if (error instanceof QueryFailedError) {
        throw new BadRequestException('Invalid object type id');
      }
      throw error;
    }
  }
}
