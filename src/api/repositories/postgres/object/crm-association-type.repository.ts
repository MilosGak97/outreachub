import { CrmAssociationType } from '../../../entities/object/crm-association-type.entity';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { DataSource, In } from 'typeorm';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { CreateCrmAssociationTypeDto } from '../../../client/object-related/crm-association-type/dto/create-crm-association-type.dto';
import { GetAllAssociationTypesResponseDto } from '../../../client/object-related/crm-association-type/dto/get-all-association-types-response.dto';
import { GetAllAssociationTypesQueryDto } from '../../../client/object-related/crm-association-type/dto/get-all-association-types-query.dto';
import { AssociationTypeDto } from '../../../client/object-related/crm-association-type/dto/association-type.dto';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';
import { GetSingleAssociationTypeDto } from '../../../client/object-related/crm-association-type/dto/get-single-association-type.dto';
import { UpdateCrmAssociationTypeDto } from '../../../client/object-related/crm-association-type/dto/update-crm-association-type.dto';
import { AssociationCardinality } from '../../../enums/object/association-cardinality.enum';
import { CrmObjectAssociation } from '../../../entities/object/crm-object-association.entity';
import { TemplateItemProtection } from '../../../enums/template/template-item-protection.enum';

@Injectable()
export class CrmAssociationTypeRepository extends BaseCompanyRepository<CrmAssociationType> {
  constructor(
    private readonly dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(CrmAssociationType, dataSource, companyContext);
  }

  async getAllAssociationTypes(
    dto: GetAllAssociationTypesQueryDto,
    companyId: string,
  ): Promise<GetAllAssociationTypesResponseDto> {
    const { limit, offset, searchQuery, objectTypeId } = dto;
    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);

    const query = this.createQueryBuilder('associationType')
      .leftJoinAndSelect('associationType.sourceObjectType', 'sourceObjectType')
      .leftJoinAndSelect('associationType.targetObjectType', 'targetObjectType');

    query.andWhere('associationType.companyId = :companyId', { companyId });

    if (searchQuery) {
      query.andWhere(
        '(associationType.name ILIKE :searchQuery OR associationType.api_name ILIKE :searchQuery)',
        { searchQuery: `%${searchQuery}%` },
      );
    }

    if (objectTypeId) {
      query.andWhere(
        '(sourceObjectType.id = :objectTypeId OR (targetObjectType.id = :objectTypeId AND associationType.isBidirectional = true))',
        { objectTypeId },
      );
    }

    query.orderBy('associationType.name', 'ASC');
    query.take(limitNumber);
    query.skip(offsetNumber);

    const [records, totalRecords] = await query.getManyAndCount();

    const result: AssociationTypeDto[] = records.map((record) => this.toDto(record));

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

  async createAssociationType(dto: CreateCrmAssociationTypeDto): Promise<string> {
    if (!/^[a-z][a-z0-9_]*$/.test(dto.apiName)) {
      throw new BadRequestException('apiName must be lowercase snake_case');
    }

    if (dto.sourceObjectTypeId === dto.targetObjectTypeId) {
      throw new BadRequestException('Self-associations are not supported.');
    }

    const apiNameExists = await this.existsBy({ apiName: dto.apiName });
    if (apiNameExists) {
      throw new BadRequestException(`apiName '${dto.apiName}' already exists`);
    }

    const companyId = this.companyContext.currentCompanyId;
    const objectTypeRepo = this.manager.getRepository(CrmObjectType);

    const [sourceObjectType, targetObjectType] = await Promise.all([
      objectTypeRepo.findOne({
        where: { id: dto.sourceObjectTypeId, company: { id: companyId } },
      }),
      objectTypeRepo.findOne({
        where: { id: dto.targetObjectTypeId, company: { id: companyId } },
      }),
    ]);

    if (!sourceObjectType) {
      throw new BadRequestException(
        `sourceObjectTypeId '${dto.sourceObjectTypeId}' not found`,
      );
    }

    if (!targetObjectType) {
      throw new BadRequestException(
        `targetObjectTypeId '${dto.targetObjectTypeId}' not found`,
      );
    }

    const associationType = this.create({
      name: dto.name,
      apiName: dto.apiName,
      description: dto.description,
      isBidirectional: dto.isBidirectional ?? true,
      reverseName: dto.reverseName,
      sourceObjectType: { id: dto.sourceObjectTypeId } as CrmObjectType,
      targetObjectType: { id: dto.targetObjectTypeId } as CrmObjectType,
      sourceCardinality: dto.sourceCardinality,
      targetCardinality: dto.targetCardinality,
    });

    const saved = await this.save(associationType);
    return saved.id;
  }

  async getSingleAssociationType(id: string): Promise<GetSingleAssociationTypeDto> {
    const associationType = await this.findOne({
      where: { id },
      relations: ['sourceObjectType', 'targetObjectType'],
    });

    if (!associationType) {
      throw new BadRequestException(`id '${id}' not found`);
    }

    return {
      id: associationType.id,
      name: associationType.name,
      apiName: associationType.apiName,
      description: associationType.description,
      isBidirectional: associationType.isBidirectional,
      reverseName: associationType.reverseName,
      sourceObjectTypeId: associationType.sourceObjectType?.id,
      targetObjectTypeId: associationType.targetObjectType?.id,
      sourceCardinality: associationType.sourceCardinality,
      targetCardinality: associationType.targetCardinality,
    };
  }

  async getAssociationTypesForObjectPair(
    sourceObjectTypeId: string,
    targetObjectTypeId: string,
    companyId: string,
  ): Promise<AssociationTypeDto[]> {
    const objectTypeRepo = this.manager.getRepository(CrmObjectType);
    const objectTypes = await objectTypeRepo.find({
      where: {
        id: In([sourceObjectTypeId, targetObjectTypeId]),
        company: { id: companyId },
      },
    });

    const objectTypeById = new Map(objectTypes.map((type) => [type.id, type]));
    const sourceExists = objectTypeById.has(sourceObjectTypeId);
    const targetExists = objectTypeById.has(targetObjectTypeId);

    if (!sourceExists) {
      throw new BadRequestException(
        `sourceObjectTypeId '${sourceObjectTypeId}' not found`,
      );
    }

    if (!targetExists) {
      throw new BadRequestException(
        `targetObjectTypeId '${targetObjectTypeId}' not found`,
      );
    }

    const records = await this.createQueryBuilder('associationType')
      .leftJoinAndSelect('associationType.sourceObjectType', 'sourceObjectType')
      .leftJoinAndSelect('associationType.targetObjectType', 'targetObjectType')
      .where('associationType.companyId = :companyId', { companyId })
      .andWhere(
        '(sourceObjectType.id = :sourceId AND targetObjectType.id = :targetId) OR (sourceObjectType.id = :targetId AND targetObjectType.id = :sourceId)',
        {
          sourceId: sourceObjectTypeId,
          targetId: targetObjectTypeId,
        },
      )
      .orderBy('associationType.name', 'ASC')
      .getMany();

    return records.map((record) => this.toDto(record));
  }

  async checkApiName(apiName: string): Promise<boolean> {
    if (!/^[a-z][a-z0-9_]*$/.test(apiName)) {
      throw new BadRequestException('apiName must be lowercase snake_case');
    }

    const exists = await this.existsBy({ apiName });
    return !exists;
  }

  private async ensureCardinalityChangeAllowed(
    associationTypeId: string,
    nextSourceCardinality?: AssociationCardinality,
    nextTargetCardinality?: AssociationCardinality,
  ): Promise<void> {
    const companyId = this.companyContext.currentCompanyId;
    const assocRepo = this.manager.getRepository(CrmObjectAssociation);

    if (nextSourceCardinality === AssociationCardinality.ONE) {
      const violatingSource = await assocRepo
        .createQueryBuilder('assoc')
        .select('assoc.sourceObjectId', 'sourceObjectId')
        .where('assoc.companyId = :companyId', { companyId })
        .andWhere('assoc.typeId = :typeId', { typeId: associationTypeId })
        .groupBy('assoc.sourceObjectId')
        .having('COUNT(*) > 1')
        .limit(1)
        .getRawOne();

      if (violatingSource) {
        throw new BadRequestException(
          'Cannot set sourceCardinality=ONE because existing associations violate the constraint.',
        );
      }
    }

    if (nextTargetCardinality === AssociationCardinality.ONE) {
      const violatingTarget = await assocRepo
        .createQueryBuilder('assoc')
        .select('assoc.targetObjectId', 'targetObjectId')
        .where('assoc.companyId = :companyId', { companyId })
        .andWhere('assoc.typeId = :typeId', { typeId: associationTypeId })
        .groupBy('assoc.targetObjectId')
        .having('COUNT(*) > 1')
        .limit(1)
        .getRawOne();

      if (violatingTarget) {
        throw new BadRequestException(
          'Cannot set targetCardinality=ONE because existing associations violate the constraint.',
        );
      }
    }
  }

  async updateAssociationTypeById(
    id: string,
    dto: UpdateCrmAssociationTypeDto,
  ): Promise<void> {
    const associationType = await this.findOne({ where: { id } });

    if (!associationType) {
      throw new NotFoundException(`CRM association type with ID '${id}' not found`);
    }

    if (associationType.protection === TemplateItemProtection.FULL) {
      throw new ForbiddenException(
        'Cannot modify this association type - it is fully protected by template',
      );
    }

    if (dto.name !== undefined) associationType.name = dto.name;
    if (dto.description !== undefined) associationType.description = dto.description;
    if (dto.isBidirectional !== undefined)
      associationType.isBidirectional = dto.isBidirectional;
    if (dto.reverseName !== undefined) associationType.reverseName = dto.reverseName;

    if (associationType.isBidirectional && !associationType.reverseName) {
      throw new BadRequestException(
        'reverseName is required when isBidirectional is true.',
      );
    }

    await this.save(associationType);
  }

  async deleteAssociationTypeById(id: string): Promise<void> {
    const associationType = await this.findOne({ where: { id } });

    if (!associationType) {
      throw new NotFoundException(`CRM association type with ID '${id}' not found`);
    }

    if (
      associationType.protection === TemplateItemProtection.FULL ||
      associationType.protection === TemplateItemProtection.DELETE_PROTECTED
    ) {
      throw new ForbiddenException(
        'Cannot delete this association type - it is protected by template',
      );
    }

    const companyId = this.companyContext.currentCompanyId;
    const associationCount = await this.manager
      .getRepository(CrmObjectAssociation)
      .createQueryBuilder('assoc')
      .where('assoc.companyId = :companyId', { companyId })
      .andWhere('assoc.typeId = :typeId', { typeId: id })
      .getCount();

    if (associationCount > 0) {
      throw new BadRequestException(
        'Cannot delete association type while associations exist. Delete the associations first.',
      );
    }

    await this.remove(associationType);
  }

  async getAssociationTypeIdsByObjectType(objectTypeId: string): Promise<string[]> {
    const companyId = this.companyContext.currentCompanyId;

    const rows = await this.createQueryBuilder('associationType')
      .select('associationType.id', 'id')
      .leftJoin('associationType.sourceObjectType', 'sourceObjectType')
      .leftJoin('associationType.targetObjectType', 'targetObjectType')
      .where('associationType.companyId = :companyId', { companyId })
      .andWhere(
        '(sourceObjectType.id = :objectTypeId OR targetObjectType.id = :objectTypeId)',
        { objectTypeId },
      )
      .getRawMany();

    return rows.map((row) => row.id);
  }

  private toDto(record: CrmAssociationType): AssociationTypeDto {
    return {
      id: record.id,
      name: record.name,
      apiName: record.apiName,
      description: record.description ?? '/',
      isBidirectional: record.isBidirectional,
      reverseName: record.reverseName,
      sourceObjectTypeId: record.sourceObjectType?.id,
      targetObjectTypeId: record.targetObjectType?.id,
      sourceObjectTypeName: record.sourceObjectType?.name,
      targetObjectTypeName: record.targetObjectType?.name,
      sourceCardinality: record.sourceCardinality,
      targetCardinality: record.targetCardinality,
    };
  }
}
