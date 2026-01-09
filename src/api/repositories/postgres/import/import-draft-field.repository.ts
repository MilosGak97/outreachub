import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ImportDraftField } from '../../../entities/import/import-draft-field.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { CreateImportDraftFieldDto } from '../../../client/object-related/import/dto/create-import-draft-field.dto';
import { ImportDraftFieldDto } from '../../../client/object-related/import/dto/import-draft-field.dto';
import { ImportSession } from '../../../entities/import/import-session.entity';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';
import { CrmObjectField } from '../../../entities/object/crm-object-field.entity';
import { FieldRegistry } from '../../../client/object-related/crm-object-field/field-types';
import { FieldType } from '../../../client/object-related/crm-object-field/field-types/field-type.enum';
import { PrimitiveValueType } from '../../../client/object-related/crm-object-field/formula/primitive-value-type.enum';
import { validateAndNormalizeFieldConfig } from '../../../client/object-related/crm-object-field/field-types/validate-field-config';

@Injectable()
export class ImportDraftFieldRepository extends BaseCompanyRepository<ImportDraftField> {
  constructor(
    dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(ImportDraftField, dataSource, companyContext);
  }

  async createDraftField(
    sessionId: string,
    dto: CreateImportDraftFieldDto,
  ): Promise<ImportDraftFieldDto> {
    const companyId = this.companyContext.currentCompanyId;
    const sessionRepo = this.manager.getRepository(ImportSession);
    const objectTypeRepo = this.manager.getRepository(CrmObjectType);
    const crmFieldRepo = this.manager.getRepository(CrmObjectField);

    const session = await sessionRepo.findOne({
      where: { id: sessionId, company: { id: companyId } },
    });

    if (!session) {
      throw new BadRequestException('Import session not found');
    }

    const objectType = await objectTypeRepo.findOne({
      where: { id: dto.objectTypeId, company: { id: companyId } },
    });

    if (!objectType) {
      throw new NotFoundException('Object type not found');
    }

    const formulaFieldTypes =
      dto.fieldType === FieldType.FORMULA && dto.configShape
        ? await this.getFormulaFieldTypes(dto.objectTypeId, companyId)
        : undefined;

    const { normalizedConfigShape } = validateAndNormalizeFieldConfig({
      fieldType: dto.fieldType,
      shape: dto.shape,
      configShape: dto.configShape,
      formulaFieldTypes,
    });

    if (dto.apiName !== undefined) {
      const existingApiName = await crmFieldRepo.findOne({
        where: {
          apiName: dto.apiName,
          company: { id: companyId },
        },
      });
      if (existingApiName) {
        throw new BadRequestException(`apiName: '${dto.apiName}' is already used in this company.`);
      }
    }

    const draft = this.create({
      importSession: { id: sessionId } as ImportSession,
      objectType,
      name: dto.name,
      apiName: dto.apiName,
      fieldType: dto.fieldType,
      description: dto.description,
      isRequired: dto.isRequired ?? false,
      shape: dto.shape,
      configShape: normalizedConfigShape,
    });

    const saved = await this.save(draft);
    return this.toDto(saved, sessionId, dto.objectTypeId);
  }

  private toDto(
    entity: ImportDraftField,
    importSessionId: string,
    objectTypeId: string,
  ): ImportDraftFieldDto {
    return {
      id: entity.id,
      importSessionId,
      objectTypeId,
      name: entity.name,
      apiName: entity.apiName,
      fieldType: entity.fieldType,
      description: entity.description,
      isRequired: entity.isRequired,
      shape: entity.shape,
      configShape: entity.configShape,
    };
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

  private async getFormulaFieldTypes(
    objectTypeId: string,
    companyId: string,
  ): Promise<Record<string, PrimitiveValueType>> {
    const crmFieldRepo = this.manager.getRepository(CrmObjectField);
    const fields = await crmFieldRepo.find({
      where: {
        objectType: { id: objectTypeId },
        company: { id: companyId },
      },
    });

    const fieldTypes: Record<string, PrimitiveValueType> = {};

    for (const field of fields) {
      if (!field.apiName) {
        continue;
      }
      const meta = FieldRegistry[field.fieldType];
      if (meta?.isUsableInFormula !== true) {
        continue;
      }
      fieldTypes[field.apiName] = this.primitiveValueTypeForFieldType(field.fieldType);
    }

    return fieldTypes;
  }
}
