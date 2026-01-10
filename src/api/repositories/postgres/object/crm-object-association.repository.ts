import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CrmObjectAssociation } from '../../../entities/object/crm-object-association.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { CrmAssociationType } from '../../../entities/object/crm-association-type.entity';
import { CrmObject } from '../../../entities/object/crm-object.entity';
import {
  GetAssociationsQueryDto,
} from '../../../client/object-related/crm-object-association/dto/requests/get-associations-query.dto';
import {
  AssociationListResponseDto,
} from '../../../client/object-related/crm-object-association/dto/responses/association-list-response.dto';
import {
  CrmObjectAssociationResponseDto,
} from '../../../client/object-related/crm-object-association/dto/responses/association-response.dto';

@Injectable()
export class CrmObjectAssociationRepository extends BaseCompanyRepository<CrmObjectAssociation> {
  constructor(
    private readonly dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(CrmObjectAssociation, dataSource, companyContext);
  }

  async findAssociationTypeOrThrow(id: string): Promise<CrmAssociationType> {
    const type = await this.manager.getRepository(CrmAssociationType).findOne({
      where: {
        id,
        company: { id: this.companyContext.currentCompanyId },
      },
      relations: ['sourceObjectType', 'targetObjectType'],
    });

    if (!type) {
      throw new NotFoundException(`Association type with ID '${id}' not found`);
    }

    return type;
  }

  async findObjectOrThrow(id: string): Promise<CrmObject> {
    const obj = await this.manager.getRepository(CrmObject).findOne({
      where: {
        id,
        company: { id: this.companyContext.currentCompanyId },
      },
      relations: ['objectType'],
    });

    if (!obj) {
      throw new NotFoundException(`Object with ID '${id}' not found`);
    }

    return obj;
  }

  async createAssociation(
    typeId: string,
    sourceObjectId: string,
    targetObjectId: string,
    metadata?: Record<string, any>,
  ): Promise<CrmObjectAssociation> {
    const type = await this.findAssociationTypeOrThrow(typeId);
    const sourceObject = await this.findObjectOrThrow(sourceObjectId);
    const targetObject = await this.findObjectOrThrow(targetObjectId);

    const association = this.create({
      type,
      sourceObject,
      targetObject,
      metadata,
    });

    return await this.save(association);
  }

  async getAssociationByIdOrThrow(id: string): Promise<CrmObjectAssociation> {
    const assoc = await this.findOne({
      where: { id },
      relations: [
        'type',
        'sourceObject',
        'sourceObject.objectType',
        'targetObject',
        'targetObject.objectType',
      ],
    });

    if (!assoc) {
      throw new NotFoundException(`Association with ID '${id}' not found`);
    }

    return assoc;
  }

  async getAssociations(dto: GetAssociationsQueryDto): Promise<AssociationListResponseDto> {
    const { sourceObjectId, targetObjectId, typeId, limit, offset } = dto;

    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);
    const companyId = this.companyContext.currentCompanyId;

    const query = this.createQueryBuilder('assoc')
      .leftJoinAndSelect('assoc.type', 'type')
      .leftJoinAndSelect('assoc.sourceObject', 'sourceObject')
      .leftJoinAndSelect('sourceObject.objectType', 'sourceObjectType')
      .leftJoinAndSelect('assoc.targetObject', 'targetObject')
      .leftJoinAndSelect('targetObject.objectType', 'targetObjectType')
      .where('assoc.companyId = :companyId', { companyId });

    if (sourceObjectId) {
      query.andWhere('sourceObject.id = :sourceObjectId', { sourceObjectId });
    }

    if (targetObjectId) {
      query.andWhere('targetObject.id = :targetObjectId', { targetObjectId });
    }

    if (typeId) {
      query.andWhere('type.id = :typeId', { typeId });
    }

    query.orderBy('assoc.createdAt', 'DESC');
    query.take(limitNumber).skip(offsetNumber);

    const [records, totalRecords] = await query.getManyAndCount();

    const result: CrmObjectAssociationResponseDto[] = records.map((assoc) =>
      this.toResponseDto(assoc),
    );

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

  async getAssociationsForObject(
    objectId: string,
    typeId?: string,
  ): Promise<CrmObjectAssociation[]> {
    const companyId = this.companyContext.currentCompanyId;

    const query = this.createQueryBuilder('assoc')
      .leftJoinAndSelect('assoc.type', 'type')
      .leftJoinAndSelect('assoc.sourceObject', 'sourceObject')
      .leftJoinAndSelect('sourceObject.objectType', 'sourceObjectType')
      .leftJoinAndSelect('assoc.targetObject', 'targetObject')
      .leftJoinAndSelect('targetObject.objectType', 'targetObjectType')
      .where('assoc.companyId = :companyId', { companyId })
      .andWhere(
        '(sourceObject.id = :objectId OR targetObject.id = :objectId)',
        { objectId },
      );

    if (typeId) {
      query.andWhere('type.id = :typeId', { typeId });
    }

    query.orderBy('assoc.created_at', 'DESC');

    return await query.getMany();
  }

  async countAssociationsForRole(
    typeId: string,
    objectId: string,
    role: 'source' | 'target',
  ): Promise<number> {
    const companyId = this.companyContext.currentCompanyId;

    const query = this.createQueryBuilder('assoc')
      .innerJoin('assoc.type', 'type')
      .where('assoc.companyId = :companyId', { companyId })
      .andWhere('type.id = :typeId', { typeId });

    if (role === 'source') {
      query.innerJoin('assoc.sourceObject', 'obj').andWhere('obj.id = :objectId', { objectId });
    } else {
      query.innerJoin('assoc.targetObject', 'obj').andWhere('obj.id = :objectId', { objectId });
    }

    return await query.getCount();
  }

  async existsAssociation(
    typeId: string,
    sourceObjectId: string,
    targetObjectId: string,
  ): Promise<boolean> {
    const companyId = this.companyContext.currentCompanyId;

    const count = await this.createQueryBuilder('assoc')
      .innerJoin('assoc.type', 'type')
      .innerJoin('assoc.sourceObject', 'source')
      .innerJoin('assoc.targetObject', 'target')
      .where('assoc.companyId = :companyId', { companyId })
      .andWhere('type.id = :typeId', { typeId })
      .andWhere('source.id = :sourceObjectId', { sourceObjectId })
      .andWhere('target.id = :targetObjectId', { targetObjectId })
      .getCount();

    return count > 0;
  }

  async deleteAssociation(id: string): Promise<void> {
    const assoc = await this.getAssociationByIdOrThrow(id);

    const reverseFromAssoc = assoc.reverseOf ?? null;
    const reverseToAssocs = await this.find({
      where: { reverseOf: { id: assoc.id } },
    });

    const idsToDelete = new Set<string>([assoc.id]);
    if (reverseFromAssoc) {
      idsToDelete.add(reverseFromAssoc.id);
    }
    for (const reverseAssoc of reverseToAssocs) {
      idsToDelete.add(reverseAssoc.id);
    }

    const idsArray = Array.from(idsToDelete);

    if (idsArray.length > 0) {
      await this.createQueryBuilder()
        .update(CrmObjectAssociation)
        .set({ reverseOf: null })
        .where('id IN (:...ids)', { ids: idsArray })
        .orWhere('reverseOfId IN (:...ids)', { ids: idsArray })
        .execute();
    }

    for (const reverseAssoc of reverseToAssocs) {
      if (reverseAssoc.id !== assoc.id) {
        await this.remove(reverseAssoc);
      }
    }

    if (reverseFromAssoc && reverseFromAssoc.id !== assoc.id) {
      await this.remove(reverseFromAssoc);
    }

    await this.remove(assoc);
  }

  async deleteAssociationsForObject(objectId: string): Promise<void> {
    const companyId = this.companyContext.currentCompanyId;

    const rows = await this.createQueryBuilder('assoc')
      .select('assoc.id', 'id')
      .where('assoc.companyId = :companyId', { companyId })
      .andWhere('(assoc.sourceObjectId = :objectId OR assoc.targetObjectId = :objectId)', {
        objectId,
      })
      .getRawMany();

    const ids = rows.map((row) => row.id);
    if (ids.length === 0) {
      return;
    }

    await this.createQueryBuilder()
      .update(CrmObjectAssociation)
      .set({ reverseOf: null })
      .where('id IN (:...ids)', { ids })
      .orWhere('reverseOfId IN (:...ids)', { ids })
      .execute();

    await this.createQueryBuilder()
      .delete()
      .from(CrmObjectAssociation)
      .where('companyId = :companyId', { companyId })
      .andWhere('id IN (:...ids)', { ids })
      .execute();
  }

  async deleteAssociationsForObjectType(objectTypeId: string): Promise<void> {
    const companyId = this.companyContext.currentCompanyId;

    const rows = await this.createQueryBuilder('assoc')
      .select('assoc.id', 'id')
      .leftJoin('assoc.sourceObject', 'sourceObject')
      .leftJoin('assoc.targetObject', 'targetObject')
      .where('assoc.companyId = :companyId', { companyId })
      .andWhere(
        '(sourceObject.objectTypeId = :objectTypeId OR targetObject.objectTypeId = :objectTypeId)',
        { objectTypeId },
      )
      .getRawMany();

    const ids = rows.map((row) => row.id);
    if (ids.length === 0) {
      return;
    }

    await this.createQueryBuilder()
      .update(CrmObjectAssociation)
      .set({ reverseOf: null })
      .where('id IN (:...ids)', { ids })
      .orWhere('reverseOfId IN (:...ids)', { ids })
      .execute();

    await this.createQueryBuilder()
      .delete()
      .from(CrmObjectAssociation)
      .where('companyId = :companyId', { companyId })
      .andWhere('id IN (:...ids)', { ids })
      .execute();
  }

  private toResponseDto(assoc: CrmObjectAssociation): CrmObjectAssociationResponseDto {
    return {
      id: assoc.id,
      typeId: assoc.type.id,
      typeName: assoc.type.name,
      typeApiName: assoc.type.apiName,
      sourceObjectId: assoc.sourceObject.id,
      sourceObjectDisplayName: assoc.sourceObject.displayName,
      sourceObjectTypeApiName: assoc.sourceObject.objectType?.apiName || '',
      targetObjectId: assoc.targetObject.id,
      targetObjectDisplayName: assoc.targetObject.displayName,
      targetObjectTypeApiName: assoc.targetObject.objectType?.apiName || '',
      metadata: assoc.metadata,
      createdAt: assoc.createdAt.toISOString(),
    };
  }
}
