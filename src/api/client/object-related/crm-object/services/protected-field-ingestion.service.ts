import { BadRequestException, Injectable } from '@nestjs/common';
import { ProtectedValueRepository } from '../../../../repositories/postgres/protected/protected-value.repository';
import { CrmObjectField } from '../../../../entities/object/crm-object-field.entity';
import { FieldType } from '../../crm-object-field/field-types/field-type.enum';
import { ProtectedValueType } from '../../../../enums/protected/protected-value-type.enum';
import { FieldValue } from '../../../../interfaces/object-field-values.interface';
import { MaskingStyle } from '../../../../common/masking';

const FIELD_TYPE_TO_PROTECTED_TYPE: Record<string, ProtectedValueType> = {
  [FieldType.PROTECTED_PHONE]: ProtectedValueType.PHONE,
  [FieldType.PROTECTED_EMAIL]: ProtectedValueType.EMAIL,
  [FieldType.PROTECTED_ADDRESS]: ProtectedValueType.ADDRESS,
};

const PROTECTED_FIELD_TYPES = new Set(Object.keys(FIELD_TYPE_TO_PROTECTED_TYPE));

export interface ProcessedFieldValues {
  processedFieldValues: Record<string, FieldValue>;
  createdProtectedValueIds: string[];
}

@Injectable()
export class ProtectedFieldIngestionService {
  constructor(
    private readonly protectedValueRepo: ProtectedValueRepository,
  ) {}

  isProtectedFieldType(fieldType: string): boolean {
    return PROTECTED_FIELD_TYPES.has(fieldType);
  }

  getProtectedValueType(fieldType: string): ProtectedValueType | null {
    return FIELD_TYPE_TO_PROTECTED_TYPE[fieldType] ?? null;
  }

  private normalizeProtectedPlainValue(fieldType: FieldType, value: any): string {
    if (typeof value === 'string') {
      return value;
    }

    if (fieldType === FieldType.PROTECTED_PHONE) {
      if (typeof value !== 'object' || value === null) {
        throw new BadRequestException('Phone must be an object with code and number');
      }
      const code = value.code ? String(value.code).trim() : '';
      const number = value.number ? String(value.number).trim() : '';
      if (!code || !number) {
        throw new BadRequestException('Invalid phone structure');
      }
      return `${code} ${number}`.trim();
    }

    if (fieldType === FieldType.PROTECTED_ADDRESS) {
      if (typeof value !== 'object' || value === null) {
        throw new BadRequestException('Address must be an object');
      }
      const parts = [
        value.street,
        value.city,
        value.state,
        value.zip,
        value.country,
      ]
        .map((part) => (part === undefined || part === null ? '' : String(part).trim()))
        .filter((part) => part.length > 0);
      if (parts.length === 0) {
        throw new BadRequestException('Address must be an object');
      }
      return parts.join(', ');
    }

    if (fieldType === FieldType.PROTECTED_EMAIL) {
      if (typeof value !== 'string') {
        throw new BadRequestException('Email must be a string');
      }
      return value;
    }

    throw new BadRequestException('Invalid protected field value');
  }

  async processFieldValues(params: {
    companyId: string;
    recordId: string | null;
    objectTypeApiName: string;
    fieldValues: Record<string, any>;
    fieldDefinitions: CrmObjectField[];
  }): Promise<ProcessedFieldValues> {
    const {
      companyId,
      recordId,
      objectTypeApiName,
      fieldValues,
      fieldDefinitions,
    } = params;

    const processedFieldValues: Record<string, FieldValue> = {};
    const createdProtectedValueIds: string[] = [];
    const fieldDefMap = new Map(fieldDefinitions.map((def) => [def.apiName, def]));

    for (const [apiName, value] of Object.entries(fieldValues)) {
      const fieldDef = fieldDefMap.get(apiName);

      if (!fieldDef || !this.isProtectedFieldType(fieldDef.fieldType)) {
        processedFieldValues[apiName] = value;
        continue;
      }

      if (value === null || value === undefined) {
        processedFieldValues[apiName] = null;
        continue;
      }

      if (
        typeof value === 'object' &&
        value !== null &&
        'protectedValueId' in value
      ) {
        processedFieldValues[apiName] = value;
        continue;
      }

      const plainValue = this.normalizeProtectedPlainValue(fieldDef.fieldType as FieldType, value);
      if (plainValue) {
        const protectedValueType = this.getProtectedValueType(fieldDef.fieldType);
        if (!protectedValueType) {
          processedFieldValues[apiName] = value;
          continue;
        }

        const maskingStyle = (fieldDef.configShape as any)?.maskingStyle as MaskingStyle | undefined;

        const { id: protectedValueId } = await this.protectedValueRepo.createProtectedValue({
          companyId,
          valueType: protectedValueType,
          plainValue,
          maskingStyle,
          sourceRecordId: recordId,
          sourceFieldApiName: apiName,
          sourceObjectTypeApiName: objectTypeApiName,
        });

        createdProtectedValueIds.push(protectedValueId);
        processedFieldValues[apiName] = { protectedValueId };
      }
    }

    return { processedFieldValues, createdProtectedValueIds };
  }

  async updateProtectedFieldValue(params: {
    companyId: string;
    existingProtectedValueId: string;
    newPlainValue: string;
    maskingStyle?: MaskingStyle;
  }): Promise<{ maskedLabel: string }> {
    return this.protectedValueRepo.updateProtectedValue(
      params.existingProtectedValueId,
      params.companyId,
      params.newPlainValue,
      params.maskingStyle,
    );
  }

  async deleteProtectedValuesForRecord(recordId: string, companyId: string): Promise<void> {
    await this.protectedValueRepo.deleteBySourceRecord(recordId, companyId);
  }
}
