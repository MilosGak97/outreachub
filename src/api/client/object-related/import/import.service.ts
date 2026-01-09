import { Injectable } from '@nestjs/common';
import { ImportSessionRepository } from '../../../repositories/postgres/import/import-session.repository';
import { ImportHealthDto } from './dto/import-health.dto';
import { ImportFileRepository } from '../../../repositories/postgres/import/import-file.repository';
import { CreateImportFileDto } from './dto/create-import-file.dto';
import { ImportFileDto } from './dto/import-file.dto';
import { CreateImportSessionDto } from './dto/create-import-session.dto';
import { ImportSessionDto } from './dto/import-session.dto';
import { CreateImportDraftFieldDto } from './dto/create-import-draft-field.dto';
import { ImportDraftFieldDto } from './dto/import-draft-field.dto';
import { UpsertImportObjectMapDto } from './dto/upsert-import-object-map.dto';
import { ImportObjectMapDto } from './dto/import-object-map.dto';
import { ImportObjectMapRepository } from '../../../repositories/postgres/import/import-object-map.repository';
import { ImportDraftFieldRepository } from '../../../repositories/postgres/import/import-draft-field.repository';
import { ImportFieldMapRepository } from '../../../repositories/postgres/import/import-field-map.repository';
import { UpsertImportFieldMapDto } from './dto/upsert-import-field-map.dto';
import { ImportFieldMapDto } from './dto/import-field-map.dto';
import { CreateImportDraftAssociationTypeDto } from './dto/create-import-draft-association-type.dto';
import { ImportDraftAssociationTypeDto } from './dto/import-draft-association-type.dto';
import { ImportDraftAssociationTypeRepository } from '../../../repositories/postgres/import/import-draft-association-type.repository';
import { UpsertImportLinkRuleDto } from './dto/upsert-import-link-rule.dto';
import { ImportLinkRuleDto } from './dto/import-link-rule.dto';
import { ImportLinkRuleRepository } from '../../../repositories/postgres/import/import-link-rule.repository';
import { ImportRowRepository } from '../../../repositories/postgres/import/import-row.repository';
import { ImportJobRepository } from '../../../repositories/postgres/import/import-job.repository';
import { ImportJobDto } from './dto/import-job.dto';
import { ImportRowResultRepository } from '../../../repositories/postgres/import/import-row-result.repository';
import { ImportResultsQueryDto } from './dto/import-results-query.dto';
import { ImportRowResultListResponseDto } from './dto/import-row-result-list-response.dto';
import { ImportStorageService } from './import-storage.service';
import { CreateImportPresignDto } from './dto/create-import-presign.dto';
import { ImportPresignResponseDto } from './dto/import-presign-response.dto';
import { UpdateImportLinkRuleDto } from './dto/update-import-link-rule.dto';
import { ImportAssociationTypesQueryDto } from './dto/import-association-types-query.dto';
import { AssociationTypeDto } from '../crm-association-type/dto/association-type.dto';
import { CrmAssociationTypeRepository } from '../../../repositories/postgres/object/crm-association-type.repository';
import { ImportRowsParseResponseDto } from './dto/import-rows-parse-response.dto';

@Injectable()
export class ImportService {
  constructor(
    private readonly importFileRepository: ImportFileRepository,
    private readonly importSessionRepository: ImportSessionRepository,
    private readonly importObjectMapRepository: ImportObjectMapRepository,
    private readonly importDraftFieldRepository: ImportDraftFieldRepository,
    private readonly importFieldMapRepository: ImportFieldMapRepository,
    private readonly importDraftAssociationTypeRepository: ImportDraftAssociationTypeRepository,
    private readonly importLinkRuleRepository: ImportLinkRuleRepository,
    private readonly importRowRepository: ImportRowRepository,
    private readonly importJobRepository: ImportJobRepository,
    private readonly importRowResultRepository: ImportRowResultRepository,
    private readonly importStorageService: ImportStorageService,
    private readonly crmAssociationTypeRepository: CrmAssociationTypeRepository,
  ) {}

  async health(): Promise<ImportHealthDto> {
    return this.importSessionRepository.healthCheck();
  }

  async createFile(dto: CreateImportFileDto): Promise<ImportFileDto> {
    return this.importFileRepository.createFile(dto);
  }

  async createUploadUrl(
    dto: CreateImportPresignDto,
    companyId: string,
  ): Promise<ImportPresignResponseDto> {
    return this.importStorageService.createUploadUrl(dto, companyId);
  }

  async createSession(
    dto: CreateImportSessionDto,
    createdById?: string,
  ): Promise<ImportSessionDto> {
    return this.importSessionRepository.createSession(dto.fileId, createdById);
  }

  async createDraftField(
    sessionId: string,
    dto: CreateImportDraftFieldDto,
  ): Promise<ImportDraftFieldDto> {
    return this.importDraftFieldRepository.createDraftField(sessionId, dto);
  }

  async upsertObjectMaps(
    sessionId: string,
    items: UpsertImportObjectMapDto[],
  ): Promise<ImportObjectMapDto[]> {
    return this.importObjectMapRepository.upsertObjectMaps(sessionId, items);
  }

  async removeMatchField(
    sessionId: string,
    objectMapId: string,
    fieldId: string,
  ): Promise<ImportObjectMapDto> {
    return this.importObjectMapRepository.removeMatchField(sessionId, objectMapId, fieldId);
  }

  async replaceFieldMaps(
    sessionId: string,
    items: UpsertImportFieldMapDto[],
  ): Promise<ImportFieldMapDto[]> {
    return this.importFieldMapRepository.replaceFieldMaps(sessionId, items);
  }

  async createDraftAssociationType(
    sessionId: string,
    dto: CreateImportDraftAssociationTypeDto,
  ): Promise<ImportDraftAssociationTypeDto> {
    return this.importDraftAssociationTypeRepository.createDraftAssociationType(
      sessionId,
      dto,
    );
  }

  async addLinkRules(
    sessionId: string,
    items: UpsertImportLinkRuleDto[],
  ): Promise<ImportLinkRuleDto[]> {
    return this.importLinkRuleRepository.addLinkRules(sessionId, items);
  }

  async updateLinkRule(
    sessionId: string,
    ruleId: string,
    dto: UpdateImportLinkRuleDto,
  ): Promise<ImportLinkRuleDto> {
    return this.importLinkRuleRepository.updateLinkRule(sessionId, ruleId, dto);
  }

  async deleteLinkRule(sessionId: string, ruleId: string): Promise<void> {
    return this.importLinkRuleRepository.deleteLinkRule(sessionId, ruleId);
  }

  async validateSession(sessionId: string): Promise<ImportSessionDto> {
    return this.importSessionRepository.validateSession(sessionId);
  }

  async parseRowsFromStorage(sessionId: string): Promise<ImportRowsParseResponseDto> {
    return this.importRowRepository.parseRowsFromStorage(sessionId);
  }

  async createJob(sessionId: string): Promise<ImportJobDto> {
    return this.importJobRepository.createJob(sessionId);
  }

  async getJob(sessionId: string, jobId: string): Promise<ImportJobDto> {
    return this.importJobRepository.getJob(sessionId, jobId);
  }

  async getResults(
    sessionId: string,
    query: ImportResultsQueryDto,
  ): Promise<ImportRowResultListResponseDto> {
    return this.importRowResultRepository.getResults(sessionId, query);
  }

  async getAssociationTypesForObjectPair(
    query: ImportAssociationTypesQueryDto,
    companyId: string,
  ): Promise<AssociationTypeDto[]> {
    return this.crmAssociationTypeRepository.getAssociationTypesForObjectPair(
      query.sourceObjectTypeId,
      query.targetObjectTypeId,
      companyId,
    );
  }
}
