import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmObjectRepository } from '../../../repositories/postgres/object/crm-object.repository';
import { CrmObjectFieldRepository } from '../../../repositories/postgres/object/crm-object-field.repository';
import { CrmObjectAssociationRepository } from '../../../repositories/postgres/object/crm-object-association.repository';
import { FieldValueValidatorService } from './services/field-value-validator.service';
import { ProtectedFieldIngestionService } from './services/protected-field-ingestion.service';
import { CompanyContext } from '../../multi-tenant-setup/company.context';
import { CreateCrmObjectDto } from './dto/requests/create-crm-object.dto';
import { UpdateCrmObjectDto } from './dto/requests/update-crm-object.dto';
import { GetAllObjectsQueryDto } from './dto/requests/get-all-objects-query.dto';
import { SearchObjectsDto } from './dto/requests/search-objects.dto';
import { BulkCreateObjectsDto, BulkObjectItemDto } from './dto/requests/bulk-create-objects.dto';
import { BulkUpdateObjectsDto } from './dto/requests/bulk-update-objects.dto';
import { BulkDeleteObjectsDto } from './dto/requests/bulk-delete-objects.dto';
import { CrmObjectResponseDto } from './dto/responses/crm-object-response.dto';
import { CrmObjectListResponseDto } from './dto/responses/crm-object-list-response.dto';
import {
  CrmObjectFullResponseDto,
  FieldWithMetadataDto,
  AssociationSummaryDto,
} from './dto/responses/crm-object-full-response.dto';
import {
  BulkCreateResponseDto,
  BulkUpdateResponseDto,
  BulkDeleteResponseDto,
  BulkResultItemDto,
} from './dto/responses/bulk-operation-response.dto';
import {
  CrmObjectListFieldValueDto,
  CrmObjectListItemDto,
} from './dto/responses/crm-object-list-item.dto';
import { MessageResponseDto } from '../../../responses/message-response.dto';
import { CrmObject } from '../../../entities/object/crm-object.entity';
import { CrmObjectField } from '../../../entities/object/crm-object-field.entity';

@Injectable()
export class CrmObjectService {
  constructor(
    private readonly crmObjectRepository: CrmObjectRepository,
    private readonly crmObjectFieldRepository: CrmObjectFieldRepository,
    private readonly crmObjectAssociationRepository: CrmObjectAssociationRepository,
    private readonly fieldValueValidator: FieldValueValidatorService,
    private readonly protectedFieldIngestionService: ProtectedFieldIngestionService,
    private readonly companyContext: CompanyContext,
  ) {}

  private splitFieldValuesByProtection(
    fieldValues: Record<string, any>,
    fieldDefinitions: CrmObjectField[],
  ): { protectedValues: Record<string, any>; nonProtectedValues: Record<string, any> } {
    const protectedValues: Record<string, any> = {};
    const nonProtectedValues: Record<string, any> = {};
    const fieldDefMap = new Map(fieldDefinitions.map((def) => [def.apiName, def]));

    for (const [apiName, value] of Object.entries(fieldValues)) {
      const fieldDef = fieldDefMap.get(apiName);
      if (fieldDef && this.protectedFieldIngestionService.isProtectedFieldType(fieldDef.fieldType)) {
        protectedValues[apiName] = value;
      } else {
        nonProtectedValues[apiName] = value;
      }
    }

    return { protectedValues, nonProtectedValues };
  }

  private async applyProtectedValues(params: {
    record: CrmObject;
    protectedValues: Record<string, any>;
    fieldDefinitions: CrmObjectField[];
  }): Promise<CrmObject> {
    const { record, protectedValues, fieldDefinitions } = params;
    if (Object.keys(protectedValues).length === 0) {
      return record;
    }

    const { processedFieldValues } = await this.protectedFieldIngestionService.processFieldValues({
      companyId: this.companyContext.currentCompanyId,
      recordId: record.id,
      objectTypeApiName: record.objectType?.apiName ?? '',
      fieldValues: protectedValues,
      fieldDefinitions,
    });

    return this.crmObjectRepository.updateObject(
      record.id,
      undefined,
      processedFieldValues,
    );
  }

  private buildListFieldValues(
    fieldDefinitions: CrmObjectField[],
    fieldValues?: Record<string, any> | null,
  ): CrmObjectListFieldValueDto[] {
    return fieldDefinitions
      .filter((field) => field.apiName)
      .map((field) => ({
        fieldId: field.id,
        apiName: field.apiName!,
        name: field.name,
        fieldType: field.fieldType,
        isRequired: field.isRequired || false,
        value: fieldValues?.[field.apiName!] ?? null,
      }));
  }

  async createObject(dto: CreateCrmObjectDto): Promise<CrmObjectResponseDto> {
    // Validate field values
    const validation = await this.fieldValueValidator.validateFieldValues(
      dto.objectTypeId,
      dto.fieldValues,
      true, // isCreate
    );

    if (!validation.valid) {
      const errorMessages = validation.errors.map((e) => e.message).join('; ');
      throw new BadRequestException(errorMessages);
    }

    const fieldDefinitions = await this.crmObjectFieldRepository.find({
      where: { objectType: { id: dto.objectTypeId } },
    });

    const { protectedValues, nonProtectedValues } = this.splitFieldValuesByProtection(
      validation.sanitizedValues,
      fieldDefinitions,
    );

    let crmObject = await this.crmObjectRepository.createObject(
      dto.objectTypeId,
      dto.displayName,
      nonProtectedValues,
    );

    crmObject = await this.applyProtectedValues({
      record: crmObject,
      protectedValues,
      fieldDefinitions,
    });

    return this.toResponseDto(crmObject);
  }

  async getObject(id: string): Promise<CrmObjectResponseDto> {
    const crmObject = await this.crmObjectRepository.getObjectByIdOrThrow(id, true);
    return this.toResponseDto(crmObject);
  }

  async getObjectFull(id: string): Promise<CrmObjectFullResponseDto> {
    const crmObject = await this.crmObjectRepository.getObjectByIdOrThrow(id, true);

    // Get field definitions
    const fields = await this.crmObjectFieldRepository.find({
      where: { objectType: { id: crmObject.objectType.id } },
    });

    // Build field with metadata
    const fieldsWithMetadata: FieldWithMetadataDto[] = fields
      .filter((f) => f.apiName)
      .map((field) => ({
        apiName: field.apiName!,
        name: field.name,
        fieldType: field.fieldType,
        isRequired: field.isRequired || false,
        value: crmObject.fieldValues?.[field.apiName!] ?? null,
        shape: field.shape,
        configShape: field.configShape,
      }));

    // Get association summaries
    const associations = await this.getAssociationSummaries(id);

    return {
      id: crmObject.id,
      objectTypeId: crmObject.objectType.id,
      objectTypeApiName: crmObject.objectType.apiName,
      objectTypeName: crmObject.objectType.name,
      displayName: crmObject.displayName,
      fieldValues: crmObject.fieldValues || {},
      fields: fieldsWithMetadata,
      associations,
      createdAt: crmObject.createdAt.toISOString(),
      updatedAt: crmObject.updatedAt.toISOString(),
    };
  }

  async getAllObjects(dto: GetAllObjectsQueryDto): Promise<CrmObjectListResponseDto> {
    return await this.crmObjectRepository.getAllObjects(dto);
  }

  async searchObjects(dto: SearchObjectsDto): Promise<CrmObjectListResponseDto> {
    return await this.crmObjectRepository.searchObjects(dto);
  }

  async updateObject(id: string, dto: UpdateCrmObjectDto): Promise<CrmObjectResponseDto> {
    // Get existing object to find its type
    const existing = await this.crmObjectRepository.getObjectByIdOrThrow(id, true);

    // Validate field values if provided
    let protectedValues: Record<string, any> = {};
    let nonProtectedValues: Record<string, any> = {};

    if (dto.fieldValues) {
      const validation = await this.fieldValueValidator.validateFieldValues(
        existing.objectType.id,
        dto.fieldValues,
        false, // not create
      );

      if (!validation.valid) {
        const errorMessages = validation.errors.map((e) => e.message).join('; ');
        throw new BadRequestException(errorMessages);
      }

      const fieldDefinitions = await this.crmObjectFieldRepository.find({
        where: { objectType: { id: existing.objectType.id } },
      });

      const split = this.splitFieldValuesByProtection(
        validation.sanitizedValues,
        fieldDefinitions,
      );
      protectedValues = split.protectedValues;
      nonProtectedValues = split.nonProtectedValues;
    }

    let updated = existing;
    if (dto.displayName !== undefined || Object.keys(nonProtectedValues).length > 0) {
      updated = await this.crmObjectRepository.updateObject(
        id,
        dto.displayName,
        Object.keys(nonProtectedValues).length > 0 ? nonProtectedValues : undefined,
      );
    }

    if (Object.keys(protectedValues).length > 0) {
      const fieldDefinitions = await this.crmObjectFieldRepository.find({
        where: { objectType: { id: existing.objectType.id } },
      });
      updated = await this.applyProtectedValues({
        record: updated,
        protectedValues,
        fieldDefinitions,
      });
    }

    return this.toResponseDto(updated);
  }

  async updateSingleField(
    objectId: string,
    fieldApiName: string,
    value: any,
  ): Promise<CrmObjectResponseDto> {
    const fieldValues = { [fieldApiName]: value };
    return this.updateObject(objectId, { fieldValues });
  }

  async deleteObject(id: string): Promise<MessageResponseDto> {
    await this.crmObjectAssociationRepository.deleteAssociationsForObject(id);
    await this.crmObjectRepository.deleteObject(id);
    return { message: 'Object deleted successfully' };
  }

  async bulkCreate(dto: BulkCreateObjectsDto): Promise<BulkCreateResponseDto> {
    const results: BulkResultItemDto[] = [];
    let successful = 0;
    let failed = 0;
    const fieldDefinitions = await this.crmObjectFieldRepository.find({
      where: { objectType: { id: dto.objectTypeId } },
    });

    for (let i = 0; i < dto.objects.length; i++) {
      const item = dto.objects[i];

      try {
        // Validate
        const validation = await this.fieldValueValidator.validateFieldValues(
          dto.objectTypeId,
          item.fieldValues,
          true,
        );

        if (!validation.valid) {
          throw new BadRequestException(
            validation.errors.map((e) => e.message).join('; '),
          );
        }

        // Create
        const { protectedValues, nonProtectedValues } = this.splitFieldValuesByProtection(
          validation.sanitizedValues,
          fieldDefinitions,
        );

        let created = await this.crmObjectRepository.createObject(
          dto.objectTypeId,
          item.displayName,
          nonProtectedValues,
        );

        created = await this.applyProtectedValues({
          record: created,
          protectedValues,
          fieldDefinitions,
        });

        results.push({ index: i, success: true, id: created.id });
        successful++;
      } catch (error) {
        results.push({
          index: i,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return {
      total: dto.objects.length,
      successful,
      failed,
      results,
    };
  }

  async bulkUpdate(dto: BulkUpdateObjectsDto): Promise<BulkUpdateResponseDto> {
    const results: BulkResultItemDto[] = [];
    let successful = 0;
    let failed = 0;
    const fieldDefinitionsCache = new Map<string, CrmObjectField[]>();

    for (let i = 0; i < dto.objects.length; i++) {
      const item = dto.objects[i];

      try {
        const existing = await this.crmObjectRepository.getObjectByIdOrThrow(item.id, true);

        let protectedValues: Record<string, any> = {};
        let nonProtectedValues: Record<string, any> = {};

        if (item.fieldValues) {
          const validation = await this.fieldValueValidator.validateFieldValues(
            existing.objectType.id,
            item.fieldValues,
            false,
          );

          if (!validation.valid) {
            throw new BadRequestException(
              validation.errors.map((e) => e.message).join('; '),
            );
          }

          let fieldDefinitions = fieldDefinitionsCache.get(existing.objectType.id);
          if (!fieldDefinitions) {
            fieldDefinitions = await this.crmObjectFieldRepository.find({
              where: { objectType: { id: existing.objectType.id } },
            });
            fieldDefinitionsCache.set(existing.objectType.id, fieldDefinitions);
          }

          const split = this.splitFieldValuesByProtection(
            validation.sanitizedValues,
            fieldDefinitions,
          );
          protectedValues = split.protectedValues;
          nonProtectedValues = split.nonProtectedValues;
        }

        if (item.displayName !== undefined || Object.keys(nonProtectedValues).length > 0) {
          await this.crmObjectRepository.updateObject(
            item.id,
            item.displayName,
            Object.keys(nonProtectedValues).length > 0 ? nonProtectedValues : undefined,
          );
        }

        if (Object.keys(protectedValues).length > 0) {
          const fieldDefinitions = fieldDefinitionsCache.get(existing.objectType.id) ?? [];
          await this.applyProtectedValues({
            record: existing,
            protectedValues,
            fieldDefinitions,
          });
        }

        results.push({ index: i, success: true, id: item.id });
        successful++;
      } catch (error) {
        results.push({
          index: i,
          success: false,
          id: item.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return {
      total: dto.objects.length,
      successful,
      failed,
      results,
    };
  }

  async bulkDelete(dto: BulkDeleteObjectsDto): Promise<BulkDeleteResponseDto> {
    const results: BulkResultItemDto[] = [];
    let successful = 0;
    let failed = 0;

    for (let i = 0; i < dto.ids.length; i++) {
      const id = dto.ids[i];

      try {
        await this.crmObjectAssociationRepository.deleteAssociationsForObject(id);
        await this.crmObjectRepository.deleteObject(id);
        results.push({ index: i, success: true, id });
        successful++;
      } catch (error) {
        results.push({
          index: i,
          success: false,
          id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        failed++;
      }
    }

    return {
      total: dto.ids.length,
      successful,
      failed,
      results,
    };
  }

  private toResponseDto(crmObject: CrmObject): CrmObjectResponseDto {
    return {
      id: crmObject.id,
      objectTypeId: crmObject.objectType?.id || '',
      objectTypeApiName: crmObject.objectType?.apiName || '',
      objectTypeName: crmObject.objectType?.name || '',
      displayName: crmObject.displayName,
      fieldValues: crmObject.fieldValues || {},
      createdAt: crmObject.createdAt.toISOString(),
      updatedAt: crmObject.updatedAt.toISOString(),
    };
  }

  private async getAssociationSummaries(objectId: string): Promise<AssociationSummaryDto[]> {
    // Get associations where this object is the source
    const sourceAssociations = await this.crmObjectAssociationRepository.find({
      where: { sourceObject: { id: objectId } },
      relations: ['type', 'targetObject', 'targetObject.objectType'],
    });

    // Get associations where this object is the target
    const targetAssociations = await this.crmObjectAssociationRepository.find({
      where: { targetObject: { id: objectId } },
      relations: ['type', 'sourceObject', 'sourceObject.objectType'],
    });

    const fieldDefinitionsCache = new Map<string, CrmObjectField[]>();
    const getFieldDefinitions = async (objectTypeId?: string): Promise<CrmObjectField[]> => {
      if (!objectTypeId) {
        return [];
      }

      const cached = fieldDefinitionsCache.get(objectTypeId);
      if (cached) {
        return cached;
      }

      const fields = await this.crmObjectFieldRepository.find({
        where: { objectType: { id: objectTypeId } },
      });
      const filteredFields = fields.filter((field) => field.apiName);
      fieldDefinitionsCache.set(objectTypeId, filteredFields);
      return filteredFields;
    };

    // Group by association type
    const summaryMap = new Map<string, AssociationSummaryDto>();

    // Process source associations
    for (const assoc of sourceAssociations) {
      const key = `${assoc.type.id}-source`;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          typeId: assoc.type.id,
          typeName: assoc.type.name,
          typeApiName: assoc.type.apiName,
          direction: 'source',
          count: 0,
          preview: [],
        });
      }

      const summary = summaryMap.get(key)!;
      summary.count++;

      if (summary.preview.length < 5) {
        const fieldDefinitions = await getFieldDefinitions(
          assoc.targetObject.objectType?.id,
        );
        summary.preview.push({
          id: assoc.targetObject.id,
          displayName: assoc.targetObject.displayName,
          fieldValues: this.buildListFieldValues(
            fieldDefinitions,
            assoc.targetObject.fieldValues,
          ),
          createdAt: assoc.targetObject.createdAt.toISOString(),
          updatedAt: assoc.targetObject.updatedAt.toISOString(),
        });
      }
    }

    // Process target associations
    for (const assoc of targetAssociations) {
      const key = `${assoc.type.id}-target`;
      if (!summaryMap.has(key)) {
        summaryMap.set(key, {
          typeId: assoc.type.id,
          typeName: assoc.type.reverseName || assoc.type.name,
          typeApiName: assoc.type.apiName,
          direction: 'target',
          count: 0,
          preview: [],
        });
      }

      const summary = summaryMap.get(key)!;
      summary.count++;

      if (summary.preview.length < 5) {
        const fieldDefinitions = await getFieldDefinitions(
          assoc.sourceObject.objectType?.id,
        );
        summary.preview.push({
          id: assoc.sourceObject.id,
          displayName: assoc.sourceObject.displayName,
          fieldValues: this.buildListFieldValues(
            fieldDefinitions,
            assoc.sourceObject.fieldValues,
          ),
          createdAt: assoc.sourceObject.createdAt.toISOString(),
          updatedAt: assoc.sourceObject.updatedAt.toISOString(),
        });
      }
    }

    return Array.from(summaryMap.values());
  }
}
