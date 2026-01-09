import { DataSource } from 'typeorm';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { CreateCrmObjectTypeDto } from '../../../client/object-related/crm-object-type/dto/create-crm-object-type.dto';
import { ObjectTypeDto } from '../../../client/object-related/crm-object-type/dto/object-type.dto';
import {
  GetAllObjectsResponseDto
} from '../../../client/object-related/crm-object-type/dto/get-all-objects-response.dto';
import { GetAllQueryDto } from '../../../client/object-related/crm-object-type/dto/get-all-query.dto';
import { ObjectFieldDto } from '../../../client/object-related/crm-object-type/dto/object-field.dto';
import { GetSingleObjectTypeDto } from '../../../client/object-related/crm-object-type/dto/get-single-object.dto';
import { CrmAssociationType } from '../../../entities/object/crm-association-type.entity';
import { TemplateItemProtection } from '../../../enums/template/template-item-protection.enum';

@Injectable()
export class CrmObjectTypeRepository extends BaseCompanyRepository<CrmObjectType> {
  constructor(
     dataSource: DataSource,
     companyContext: CompanyContext,
  ) {
    super(CrmObjectType, dataSource,companyContext);
  }

  // type code below

  async getAllObjectTypes(dto: GetAllQueryDto, companyId): Promise<GetAllObjectsResponseDto>{
      const { limit, offset, searchQuery, associationCheck } = dto;

    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);

    const query = this.createQueryBuilder('object');


    // 1) Always filter by company
    query.andWhere('object.companyId = :companyId', { companyId });

    if (searchQuery) {
      query.andWhere(
        '(object.name ILIKE :searchQuery OR object.api_name ILIKE :searchQuery)',
        { searchQuery: `%${searchQuery}%` },
      );
    }

    if (associationCheck) {
      query.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('1')
          .from(CrmAssociationType, 'associationType')
          .leftJoin('associationType.sourceObjectType', 'assocSource')
          .leftJoin('associationType.targetObjectType', 'assocTarget')
          .where('associationType.companyId = :companyId', { companyId })
          .andWhere(
            '(assocSource.id = object.id AND assocTarget.id = :associationCheck) OR (assocTarget.id = object.id AND assocSource.id = :associationCheck)',
            { associationCheck },
          )
          .getQuery();

        return `NOT EXISTS ${subQuery}`;
      });

      query.andWhere('object.id != :associationCheck', { associationCheck });
    }

    query.orderBy('object.name', 'ASC');
    query.take(limitNumber);
    query.skip(offsetNumber);

    const [records, totalRecords] = await query.getManyAndCount();


    const result: ObjectTypeDto[] = records.map(
      ({ id, name, apiName, description}) => ({
        id:    id ?? '/',
        name:  name ?? '/',
        apiName: apiName ?? '/',
        description: description ?? '/',
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

  }

  async createObject(dto: CreateCrmObjectTypeDto): Promise<string> {
    // Validate API name format
    if (!/^[a-z][a-z0-9_]*$/.test(dto.apiName)) {
      throw new BadRequestException('apiName must be lowercase snake_case');
    }

    // Check for duplicate apiName within company
    const exists = await this.existsBy({ apiName: dto.apiName });
    if (exists) {
      throw new BadRequestException(`apiName '${dto.apiName}' already exists`);

    }

    // Create and save the new object type
    const objectType = this.create({
      name: dto.name,
      apiName: dto.apiName,
      description: dto.description,
    });

    const object = await this.save(objectType);
    return object.id;
  }

  async getSingleObject(id: string): Promise<GetSingleObjectTypeDto> {
    const object: CrmObjectType = await this.findOne({where: {id}})
    if (!object) {
      throw new BadRequestException(`id '${id}' not found`);
    }

    const result: GetSingleObjectTypeDto = {
      id: object.id ?? '/',
      name: object.name ?? '/',
      apiName: object.apiName ?? '/',
      description: object.description ?? '/',
    };

    return result;
  }

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

  async updateObjectById(
    id: string,
    dto: { name?: string; description?: string },
  ): Promise<void> {
    const objectType = await this.findOne({ where: { id } });

    if (!objectType) {
      throw new NotFoundException(`CRM object type with ID '${id}' not found`);
    }

    if (objectType.protection === TemplateItemProtection.FULL) {
      throw new ForbiddenException(
        'Cannot modify this object type - it is fully protected by template',
      );
    }

    if (dto.name !== undefined) objectType.name = dto.name;
    if (dto.description !== undefined) objectType.description = dto.description;

    await this.save(objectType);
  }

  async deleteObjectById(id: string): Promise<void> {
    const objectType = await this.findOne({ where: { id } });

    if (!objectType) {
      throw new NotFoundException('Object type not found');
    }

    if (
      objectType.protection === TemplateItemProtection.FULL ||
      objectType.protection === TemplateItemProtection.DELETE_PROTECTED
    ) {
      throw new ForbiddenException(
        'Cannot delete this object type - it is protected by template',
      );
    }

    await this.remove(objectType);
  }


}
