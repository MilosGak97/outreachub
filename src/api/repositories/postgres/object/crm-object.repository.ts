import { CrmObject } from '../../../entities/object/crm-object.entity';
import { CrmObjectField } from '../../../entities/object/crm-object-field.entity';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';
import {
  GetAllObjectsQueryDto,
} from '../../../client/object-related/crm-object/dto/requests/get-all-objects-query.dto';
import {
  SearchObjectsDto,
  FilterOperator,
  FieldFilterDto,
} from '../../../client/object-related/crm-object/dto/requests/search-objects.dto';
import {
  CrmObjectListResponseDto,
} from '../../../client/object-related/crm-object/dto/responses/crm-object-list-response.dto';
import {
  CrmObjectListFieldValueDto,
  CrmObjectListItemDto,
} from '../../../client/object-related/crm-object/dto/responses/crm-object-list-item.dto';

type FieldSortConfig = {
  field: string;
  order: 'ASC' | 'DESC';
};

@Injectable()
export class CrmObjectRepository extends BaseCompanyRepository<CrmObject> {
  constructor(
    private readonly dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(CrmObject, dataSource, companyContext);
  }

  async findObjectTypeOrThrow(id: string): Promise<CrmObjectType> {
    const objectType = await this.manager.getRepository(CrmObjectType).findOne({
      where: {
        id,
        company: { id: this.companyContext.currentCompanyId },
      },
    });

    if (!objectType) {
      throw new NotFoundException(`Object type with ID '${id}' not found`);
    }

    return objectType;
  }

  async createObject(
    objectTypeId: string,
    displayName: string,
    fieldValues: Record<string, any>,
  ): Promise<CrmObject> {
    const objectType = await this.findObjectTypeOrThrow(objectTypeId);

    const crmObject = this.create({
      objectType,
      displayName,
      fieldValues: fieldValues || {},
    });

    return await this.save(crmObject);
  }

  async getObjectById(id: string, includeRelations = true): Promise<CrmObject | null> {
    const relations: string[] = includeRelations
      ? ['objectType', 'sourceAssociations', 'targetAssociations']
      : ['objectType'];

    return await this.findOne({
      where: { id },
      relations,
    });
  }

  async getObjectByIdOrThrow(id: string, includeRelations = true): Promise<CrmObject> {
    const obj = await this.getObjectById(id, includeRelations);
    if (!obj) {
      throw new NotFoundException(`Object with ID '${id}' not found`);
    }
    return obj;
  }

  async getAllObjects(dto: GetAllObjectsQueryDto): Promise<CrmObjectListResponseDto> {
    const { objectTypeId, limit, offset, searchQuery, sortBy, sortOrder } = dto;

    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);
    const companyId = this.companyContext.currentCompanyId;

    // Verify object type exists
    await this.findObjectTypeOrThrow(objectTypeId);

    const query = this.createQueryBuilder('obj')
      .leftJoinAndSelect('obj.objectType', 'objectType')
      .where('obj.companyId = :companyId', { companyId })
      .andWhere('objectType.id = :objectTypeId', { objectTypeId });

    if (searchQuery) {
      query.andWhere('obj.display_name ILIKE :searchQuery', {
        searchQuery: `%${searchQuery}%`,
      });
    }

    // Apply sorting
    const fieldSort = this.applySorting(query, sortBy, sortOrder);

    query.take(limitNumber).skip(offsetNumber);

    const [records, totalRecords] = await query.getManyAndCount();

    const sortedRecords = fieldSort
      ? this.sortRecordsByField(records, fieldSort)
      : records;

    const fieldDefinitions = await this.getListFieldDefinitions(objectTypeId);

    const result: CrmObjectListItemDto[] = sortedRecords.map((obj) => ({
      id: obj.id,
      displayName: obj.displayName,
      fieldValues: this.buildListFieldValues(fieldDefinitions, obj.fieldValues),
      createdAt: obj.createdAt.toISOString(),
      updatedAt: obj.updatedAt.toISOString(),
    }));

    const currentPage = Math.floor(offsetNumber / limitNumber) + 1;
    const totalPages = Math.ceil(totalRecords / limitNumber);

    return {
      result,
      totalRecords,
      currentPage,
      totalPages,
      limit: limitNumber,
      offset: offsetNumber,
    };
  }

  async searchObjects(dto: SearchObjectsDto): Promise<CrmObjectListResponseDto> {
    const {
      objectTypeId,
      filters,
      filterLogic,
      limit,
      offset,
      sortBy,
      sortOrder,
    } = dto;

    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);
    const companyId = this.companyContext.currentCompanyId;

    // Verify object type exists
    await this.findObjectTypeOrThrow(objectTypeId);

    const query = this.createQueryBuilder('obj')
      .leftJoinAndSelect('obj.objectType', 'objectType')
      .where('obj.companyId = :companyId', { companyId })
      .andWhere('objectType.id = :objectTypeId', { objectTypeId });

    // Apply field filters
    if (filters && filters.length > 0) {
      this.applyFieldFilters(query, filters, filterLogic || 'AND');
    }

    // Apply sorting
    const fieldSort = this.applySorting(query, sortBy, sortOrder);

    query.take(limitNumber).skip(offsetNumber);

    const [records, totalRecords] = await query.getManyAndCount();

    const sortedRecords = fieldSort
      ? this.sortRecordsByField(records, fieldSort)
      : records;

    const fieldDefinitions = await this.getListFieldDefinitions(objectTypeId);

    const result: CrmObjectListItemDto[] = sortedRecords.map((obj) => ({
      id: obj.id,
      displayName: obj.displayName,
      fieldValues: this.buildListFieldValues(fieldDefinitions, obj.fieldValues),
      createdAt: obj.createdAt.toISOString(),
      updatedAt: obj.updatedAt.toISOString(),
    }));

    const currentPage = Math.floor(offsetNumber / limitNumber) + 1;
    const totalPages = Math.ceil(totalRecords / limitNumber);

    return {
      result,
      totalRecords,
      currentPage,
      totalPages,
      limit: limitNumber,
      offset: offsetNumber,
    };
  }

  async updateObject(
    id: string,
    displayName?: string,
    fieldValues?: Record<string, any>,
  ): Promise<CrmObject> {
    const obj = await this.getObjectByIdOrThrow(id, false);

    if (displayName !== undefined) {
      obj.displayName = displayName;
    }

    if (fieldValues !== undefined) {
      // Merge field values (update existing, add new, keep others)
      obj.fieldValues = {
        ...obj.fieldValues,
        ...fieldValues,
      };

      // Remove null values (to clear fields)
      for (const [key, value] of Object.entries(obj.fieldValues)) {
        if (value === null) {
          delete obj.fieldValues[key];
        }
      }
    }

    return await this.save(obj);
  }

  async deleteObject(id: string): Promise<void> {
    const obj = await this.getObjectByIdOrThrow(id, false);
    await this.remove(obj);
  }

  async getObjectIdsByType(objectTypeId: string): Promise<string[]> {
    const companyId = this.companyContext.currentCompanyId;

    const rows = await this.createQueryBuilder('obj')
      .select('obj.id', 'id')
      .leftJoin('obj.objectType', 'objectType')
      .where('obj.companyId = :companyId', { companyId })
      .andWhere('objectType.id = :objectTypeId', { objectTypeId })
      .getRawMany();

    return rows.map((row) => row.id);
  }

  async deleteObjectsByType(objectTypeId: string): Promise<void> {
    const companyId = this.companyContext.currentCompanyId;

    await this.createQueryBuilder()
      .delete()
      .from(CrmObject)
      .where('companyId = :companyId', { companyId })
      .andWhere('objectTypeId = :objectTypeId', { objectTypeId })
      .execute();
  }

  async bulkCreate(
    objectTypeId: string,
    items: Array<{ displayName: string; fieldValues?: Record<string, any> }>,
  ): Promise<CrmObject[]> {
    const objectType = await this.findObjectTypeOrThrow(objectTypeId);

    const objects = items.map((item) =>
      this.create({
        objectType,
        displayName: item.displayName,
        fieldValues: item.fieldValues || {},
      }),
    );

    return await this.save(objects);
  }

  async bulkUpdate(
    items: Array<{ id: string; displayName?: string; fieldValues?: Record<string, any> }>,
  ): Promise<CrmObject[]> {
    const results: CrmObject[] = [];

    for (const item of items) {
      const updated = await this.updateObject(
        item.id,
        item.displayName,
        item.fieldValues,
      );
      results.push(updated);
    }

    return results;
  }

  async bulkDelete(ids: string[]): Promise<void> {
    const companyId = this.companyContext.currentCompanyId;

    await this.createQueryBuilder()
      .delete()
      .from(CrmObject)
      .where('id IN (:...ids)', { ids })
      .andWhere('companyId = :companyId', { companyId })
      .execute();
  }

  private async getListFieldDefinitions(objectTypeId: string): Promise<CrmObjectField[]> {
    const fields = await this.manager.getRepository(CrmObjectField).find({
      where: {
        objectType: { id: objectTypeId },
        company: { id: this.companyContext.currentCompanyId },
      },
    });

    return fields.filter((field) => field.apiName);
  }

  private buildListFieldValues(
    fieldDefinitions: CrmObjectField[],
    fieldValues?: Record<string, any> | null,
  ): CrmObjectListFieldValueDto[] {
    return fieldDefinitions.map((field) => ({
      fieldId: field.id,
      apiName: field.apiName!,
      name: field.name,
      fieldType: field.fieldType,
      isRequired: field.isRequired || false,
      value: fieldValues?.[field.apiName!] ?? null,
    }));
  }

  private applySorting(
    query: SelectQueryBuilder<CrmObject>,
    sortBy?: string,
    sortOrder?: 'ASC' | 'DESC',
  ): FieldSortConfig | null {
    const order = sortOrder || 'DESC';

    if (!sortBy || sortBy === 'createdAt') {
      query.orderBy('obj.createdAt', order);
      return null;
    } else if (sortBy === 'updatedAt') {
      query.orderBy('obj.updatedAt', order);
      return null;
    } else if (sortBy === 'displayName') {
      query.orderBy('obj.displayName', order);
      return null;
    } else {
      // Sort by field value (JSONB) – do not push to SQL
      return { field: sortBy, order };
    }
    return null;
  }

  private applyFieldFilters(
    query: SelectQueryBuilder<CrmObject>,
    filters: FieldFilterDto[],
    logic: 'AND' | 'OR',
  ): void {
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    const numericOperators = new Set<FilterOperator>([
      FilterOperator.GT,
      FilterOperator.GTE,
      FilterOperator.LT,
      FilterOperator.LTE,
    ]);

    filters.forEach((filter, index) => {
      const paramName = `filter_${index}`;
      // column name is camelCase in the DB (fieldValues), so we need to double-quote it
      const fieldPath = `obj."fieldValues"->>'${filter.field}'`;

      if (
        numericOperators.has(filter.operator) &&
        (filter.value === undefined ||
          filter.value === null ||
          Number.isNaN(Number(filter.value)))
      ) {
        throw new BadRequestException('Invalid filter value');
      }

      const condition = this.buildFilterCondition(
        fieldPath,
        filter.operator,
        filter.value,
        paramName,
        params,
      );

      if (condition) {
        conditions.push(condition);
      }
    });

    if (conditions.length > 0) {
      const combinedCondition =
        logic === 'OR'
          ? `(${conditions.join(' OR ')})`
          : `(${conditions.join(' AND ')})`;

      query.andWhere(combinedCondition, params);
    }
  }

  private buildFilterCondition(
    fieldPath: string,
    operator: FilterOperator,
    value: any,
    paramName: string,
    params: Record<string, any>,
  ): string | null {
    switch (operator) {
      case FilterOperator.EQ:
        params[paramName] = String(value);
        return `${fieldPath} = :${paramName}`;

      case FilterOperator.NEQ:
        params[paramName] = String(value);
        return `${fieldPath} != :${paramName}`;

      case FilterOperator.GT:
        params[paramName] = String(value);
        return `(${fieldPath})::numeric > :${paramName}::numeric`;

      case FilterOperator.GTE:
        params[paramName] = String(value);
        return `(${fieldPath})::numeric >= :${paramName}::numeric`;

      case FilterOperator.LT:
        params[paramName] = String(value);
        return `(${fieldPath})::numeric < :${paramName}::numeric`;

      case FilterOperator.LTE:
        params[paramName] = String(value);
        return `(${fieldPath})::numeric <= :${paramName}::numeric`;

      case FilterOperator.CONTAINS:
        params[paramName] = `%${value}%`;
        return `${fieldPath} ILIKE :${paramName}`;

      case FilterOperator.STARTS_WITH:
        params[paramName] = `${value}%`;
        return `${fieldPath} ILIKE :${paramName}`;

      case FilterOperator.ENDS_WITH:
        params[paramName] = `%${value}`;
        return `${fieldPath} ILIKE :${paramName}`;

      case FilterOperator.IN:
        if (!Array.isArray(value)) {
          params[paramName] = [String(value)];
        } else {
          params[paramName] = value.map(String);
        }
        return `${fieldPath} IN (:...${paramName})`;

      case FilterOperator.IS_NULL:
        return `(${fieldPath} IS NULL OR ${fieldPath} = '')`;

      case FilterOperator.IS_NOT_NULL:
        return `(${fieldPath} IS NOT NULL AND ${fieldPath} != '')`;

      default:
        return null;
    }
  }

  private sortRecordsByField(
    records: CrmObject[],
    sortConfig: FieldSortConfig,
  ): CrmObject[] {
    return [...records].sort((a, b) => {
      const valueA = a.fieldValues?.[sortConfig.field];
      const valueB = b.fieldValues?.[sortConfig.field];
      return this.compareFieldValues(valueA, valueB, sortConfig.order);
    });
  }

  private compareFieldValues(
    valueA: any,
    valueB: any,
    order: 'ASC' | 'DESC',
  ): number {
    const nullA = valueA === undefined || valueA === null;
    const nullB = valueB === undefined || valueB === null;

    if (nullA && nullB) {
      return 0;
    }
    if (nullA) {
      return 1;
    }
    if (nullB) {
      return -1;
    }

    let comparison: number;

    if (typeof valueA === 'number' && typeof valueB === 'number') {
      comparison = valueA - valueB;
    } else {
      comparison = String(valueA).localeCompare(String(valueB));
    }

    return order === 'ASC' ? comparison : -comparison;
  }
}
