import { Injectable } from '@nestjs/common';
import { ProtectedValueRepository, ProtectedValueInfo } from '../../../../repositories/postgres/protected/protected-value.repository';
import { CrmObject } from '../../../../entities/object/crm-object.entity';
import { CrmObjectField } from '../../../../entities/object/crm-object-field.entity';
import { FieldType } from '../../crm-object-field/field-types/field-type.enum';
import { FieldRegistry } from '../../crm-object-field/field-types';
import { ProtectedFieldValueResponseDto } from '../dto/responses/protected-field-value-response.dto';
import { ProtectedFieldActionResponseDto } from '../dto/responses/protected-field-action-response.dto';

const PROTECTED_FIELD_TYPES = new Set<FieldType>([
  FieldType.PROTECTED_PHONE,
  FieldType.PROTECTED_EMAIL,
  FieldType.PROTECTED_ADDRESS,
]);

export interface TransformedFieldValues {
  [apiName: string]: any | ProtectedFieldValueResponseDto | null;
}

@Injectable()
export class ProtectedFieldTransformerService {
  constructor(
    private readonly protectedValueRepo: ProtectedValueRepository,
  ) {}

  isProtectedFieldType(fieldType: FieldType): boolean {
    return PROTECTED_FIELD_TYPES.has(fieldType);
  }

  getProtectedFieldDefinitions(fieldDefinitions: CrmObjectField[]): CrmObjectField[] {
    return fieldDefinitions.filter((field) =>
      this.isProtectedFieldType(field.fieldType as FieldType),
    );
  }

  private buildActionsForFieldType(fieldType: FieldType): ProtectedFieldActionResponseDto[] {
    const metadata = FieldRegistry[fieldType];
    if (!metadata?.actions?.length) {
      return [];
    }

    return metadata.actions.map((action) => ({
      type: action.toLowerCase(),
      enabled: true,
    }));
  }

  private transformProtectedValue(
    fieldType: FieldType,
    protectedInfo: ProtectedValueInfo,
  ): ProtectedFieldValueResponseDto {
    return {
      type: fieldType,
      protected: true,
      valueId: protectedInfo.id,
      display: protectedInfo.maskedLabel,
      actions: this.buildActionsForFieldType(fieldType),
      revealable: false,
    };
  }

  async transformRecordForResponse(params: {
    record: CrmObject;
    fieldDefinitions: CrmObjectField[];
    companyId: string;
  }): Promise<TransformedFieldValues> {
    const { record, fieldDefinitions, companyId } = params;
    const protectedFields = this.getProtectedFieldDefinitions(fieldDefinitions);

    if (!protectedFields.length) {
      return { ...record.fieldValues };
    }

    const protectedValuesMap = await this.protectedValueRepo.getProtectedValuesForRecord(
      record.id,
      companyId,
    );

    const transformedValues: TransformedFieldValues = { ...record.fieldValues };

    for (const field of protectedFields) {
      const currentValue = record.fieldValues[field.apiName];

      if (
        currentValue &&
        typeof currentValue === 'object' &&
        'protectedValueId' in currentValue
      ) {
        const protectedValueId = (currentValue as { protectedValueId: string }).protectedValueId;
        let protectedInfo = protectedValuesMap.get(field.apiName);

        if (!protectedInfo) {
          protectedInfo = await this.protectedValueRepo.getProtectedValueInfo(
            protectedValueId,
            companyId,
          ) ?? undefined;
        }

        if (protectedInfo) {
          transformedValues[field.apiName] = this.transformProtectedValue(
            field.fieldType as FieldType,
            protectedInfo,
          );
        } else {
          transformedValues[field.apiName] = null;
        }
      }
    }

    return transformedValues;
  }

  async transformRecordsForResponse(params: {
    records: CrmObject[];
    fieldDefinitions: CrmObjectField[];
    companyId: string;
  }): Promise<Array<CrmObject & { fieldValues: TransformedFieldValues }>> {
    const { records, fieldDefinitions, companyId } = params;

    const results = await Promise.all(
      records.map(async (record) => {
        const transformedFieldValues = await this.transformRecordForResponse({
          record,
          fieldDefinitions,
          companyId,
        });

        return {
          ...record,
          fieldValues: transformedFieldValues,
        };
      }),
    );

    return results;
  }
}
