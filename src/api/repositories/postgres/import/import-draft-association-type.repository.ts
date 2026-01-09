import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { ImportDraftAssociationType } from '../../../entities/import/import-draft-association-type.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { CreateImportDraftAssociationTypeDto } from '../../../client/object-related/import/dto/create-import-draft-association-type.dto';
import { ImportDraftAssociationTypeDto } from '../../../client/object-related/import/dto/import-draft-association-type.dto';
import { ImportSession } from '../../../entities/import/import-session.entity';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';

@Injectable()
export class ImportDraftAssociationTypeRepository extends BaseCompanyRepository<ImportDraftAssociationType> {
  constructor(
    dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(ImportDraftAssociationType, dataSource, companyContext);
  }

  async createDraftAssociationType(
    sessionId: string,
    dto: CreateImportDraftAssociationTypeDto,
  ): Promise<ImportDraftAssociationTypeDto> {
    const companyId = this.companyContext.currentCompanyId;
    const sessionRepo = this.manager.getRepository(ImportSession);
    const objectTypeRepo = this.manager.getRepository(CrmObjectType);

    const session = await sessionRepo.findOne({
      where: { id: sessionId, company: { id: companyId } },
    });

    if (!session) {
      throw new BadRequestException('Import session not found');
    }

    if (dto.sourceObjectTypeId === dto.targetObjectTypeId) {
      throw new BadRequestException('Self-associations are not supported.');
    }

    const objectTypes = await objectTypeRepo.find({
      where: {
        id: In([dto.sourceObjectTypeId, dto.targetObjectTypeId]),
        company: { id: companyId },
      },
    });

    const objectTypeById = new Map(objectTypes.map((type) => [type.id, type]));
    const sourceObjectType = objectTypeById.get(dto.sourceObjectTypeId);
    const targetObjectType = objectTypeById.get(dto.targetObjectTypeId);

    if (!sourceObjectType) {
      throw new BadRequestException(`Source object type '${dto.sourceObjectTypeId}' not found`);
    }

    if (!targetObjectType) {
      throw new BadRequestException(`Target object type '${dto.targetObjectTypeId}' not found`);
    }

    const draft = this.create({
      importSession: { id: sessionId } as ImportSession,
      sourceObjectType,
      targetObjectType,
      sourceCardinality: dto.sourceCardinality,
      targetCardinality: dto.targetCardinality,
      name: dto.name,
      apiName: dto.apiName,
      description: dto.description,
      isBidirectional: dto.isBidirectional ?? true,
      reverseName: dto.reverseName,
    });

    const saved = await this.save(draft);
    return this.toDto(saved, sessionId, dto.sourceObjectTypeId, dto.targetObjectTypeId);
  }

  private toDto(
    entity: ImportDraftAssociationType,
    importSessionId: string,
    sourceObjectTypeId: string,
    targetObjectTypeId: string,
  ): ImportDraftAssociationTypeDto {
    return {
      id: entity.id,
      importSessionId,
      sourceObjectTypeId,
      targetObjectTypeId,
      sourceCardinality: entity.sourceCardinality,
      targetCardinality: entity.targetCardinality,
      name: entity.name,
      apiName: entity.apiName,
      description: entity.description,
      isBidirectional: entity.isBidirectional,
      reverseName: entity.reverseName,
    };
  }
}
