import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { ImportSession } from '../../../entities/import/import-session.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { ImportSessionDto } from '../../../client/object-related/import/dto/import-session.dto';
import { ImportFile } from '../../../entities/import/import-file.entity';
import { ImportSessionStatus } from '../../../enums/import/import-session-status.enum';
import { User } from '../../../entities/user.entity';
import { ImportObjectMap } from '../../../entities/import/import-object-map.entity';
import { ImportMatchRule } from '../../../entities/import/import-match-rule.entity';
import { ImportMatchBehavior } from '../../../enums/import/import-match-behavior.enum';
import { ImportDraftField } from '../../../entities/import/import-draft-field.entity';
import { ImportFieldMap } from '../../../entities/import/import-field-map.entity';
import { CrmObjectField } from '../../../entities/object/crm-object-field.entity';
import { ImportDraftAssociationType } from '../../../entities/import/import-draft-association-type.entity';
import { CrmAssociationType } from '../../../entities/object/crm-association-type.entity';
import { ImportLinkRule } from '../../../entities/import/import-link-rule.entity';

@Injectable()
export class ImportSessionRepository extends BaseCompanyRepository<ImportSession> {
  constructor(
    dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(ImportSession, dataSource, companyContext);
  }

  async createSession(fileId: string, createdById?: string): Promise<ImportSessionDto> {
    const companyId = this.companyContext.currentCompanyId;
    const fileRepo = this.manager.getRepository(ImportFile);

    const file = await fileRepo.findOne({
      where: { id: fileId, company: { id: companyId } },
    });

    if (!file) {
      throw new BadRequestException('Import file not found');
    }

    const session = this.create({
      file,
      status: ImportSessionStatus.DRAFT,
      ...(createdById ? { createdBy: { id: createdById } as User } : {}),
    });

    const saved = await this.save(session);
    return this.toDto(saved);
  }

  async validateSession(sessionId: string): Promise<ImportSessionDto> {
    const companyId = this.companyContext.currentCompanyId;

    const session = await this.findOne({
      where: { id: sessionId },
      relations: {
        file: true,
      },
    });

    if (!session) {
      throw new BadRequestException('Import session not found');
    }

    if (session.status !== ImportSessionStatus.DRAFT) {
      throw new BadRequestException('Import session is not in DRAFT status');
    }

    const objectMapRepo = this.manager.getRepository(ImportObjectMap);
    const matchRuleRepo = this.manager.getRepository(ImportMatchRule);

    const objectMaps = await objectMapRepo.find({
      where: { importSession: { id: sessionId }, company: { id: companyId } },
    });

    if (objectMaps.length === 0) {
      throw new BadRequestException('At least one object map is required');
    }

    const matchRules = await matchRuleRepo.find({
      where: {
        company: { id: companyId },
        objectMap: { id: In(objectMaps.map((map) => map.id)) },
      },
      relations: { objectMap: true },
    });

    const matchRuleByMapId = new Map(
      matchRules.map((rule) => [rule.objectMap.id, rule]),
    );

    for (const map of objectMaps) {
      if (map.matchBehavior !== ImportMatchBehavior.CREATE) {
        const rule = matchRuleByMapId.get(map.id);
        if (!rule || !rule.matchFields || rule.matchFields.length === 0) {
          throw new BadRequestException(
            `Match fields are required for object map ${map.id}`,
          );
        }
      }
    }

    await this.promoteDraftFields(sessionId, companyId);
    await this.promoteDraftAssociations(sessionId, companyId);

    session.status = ImportSessionStatus.VALIDATED;
    const saved = await this.save(session);
    return this.toDto(saved);
  }

  async healthCheck(): Promise<{ ok: boolean; error?: string }> {
    try {
      await this.manager.query('SELECT 1');
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async promoteDraftFields(sessionId: string, companyId: string): Promise<void> {
    const draftRepo = this.manager.getRepository(ImportDraftField);
    const fieldMapRepo = this.manager.getRepository(ImportFieldMap);
    const crmFieldRepo = this.manager.getRepository(CrmObjectField);

    const drafts = await draftRepo.find({
      where: { importSession: { id: sessionId }, company: { id: companyId } },
      relations: { objectType: true },
    });

    if (drafts.length === 0) {
      return;
    }

    const draftToFieldId = new Map<string, string>();

    for (const draft of drafts) {
      if (draft.apiName) {
        const existing = await crmFieldRepo.findOne({
          where: { apiName: draft.apiName, company: { id: companyId } },
        });
        if (existing) {
          throw new BadRequestException(
            `apiName '${draft.apiName}' is already used in this company.`,
          );
        }
      }

      const field = crmFieldRepo.create({
        name: draft.name,
        description: draft.description,
        fieldType: draft.fieldType,
        apiName: draft.apiName,
        isRequired: draft.isRequired ?? false,
        shape: draft.shape,
        configShape: draft.configShape,
        objectType: { id: draft.objectType.id },
        company: { id: companyId },
      });

      const saved = await crmFieldRepo.save(field);
      draftToFieldId.set(draft.id, saved.id);
    }

    const fieldMaps = await fieldMapRepo.find({
      where: {
        company: { id: companyId },
        objectMap: { importSession: { id: sessionId } },
        draftField: { id: In([...draftToFieldId.keys()]) },
      },
      relations: { draftField: true },
    });

    for (const map of fieldMaps) {
      if (!map.draftField) {
        continue;
      }
      const newFieldId = draftToFieldId.get(map.draftField.id);
      if (!newFieldId) {
        continue;
      }
      map.targetField = { id: newFieldId } as CrmObjectField;
      map.draftField = null;
    }

    if (fieldMaps.length > 0) {
      await fieldMapRepo.save(fieldMaps);
    }
  }

  private async promoteDraftAssociations(sessionId: string, companyId: string): Promise<void> {
    const draftRepo = this.manager.getRepository(ImportDraftAssociationType);
    const assocRepo = this.manager.getRepository(CrmAssociationType);
    const linkRuleRepo = this.manager.getRepository(ImportLinkRule);

    const drafts = await draftRepo.find({
      where: { importSession: { id: sessionId }, company: { id: companyId } },
      relations: { sourceObjectType: true, targetObjectType: true },
    });

    if (drafts.length === 0) {
      return;
    }

    const draftToAssocId = new Map<string, string>();

    for (const draft of drafts) {
      const existing = await assocRepo.findOne({
        where: { apiName: draft.apiName, company: { id: companyId } },
      });
      if (existing) {
        throw new BadRequestException(
          `apiName '${draft.apiName}' is already used in this company.`,
        );
      }

      const assoc = assocRepo.create({
        name: draft.name,
        apiName: draft.apiName,
        description: draft.description,
        isBidirectional: draft.isBidirectional ?? true,
        reverseName: draft.reverseName,
        sourceCardinality: draft.sourceCardinality,
        targetCardinality: draft.targetCardinality,
        sourceObjectType: { id: draft.sourceObjectType.id },
        targetObjectType: { id: draft.targetObjectType.id },
        company: { id: companyId },
      });

      const saved = await assocRepo.save(assoc);
      draftToAssocId.set(draft.id, saved.id);
    }

    const linkRules = await linkRuleRepo.find({
      where: {
        company: { id: companyId },
        importSession: { id: sessionId },
        draftAssociationType: { id: In([...draftToAssocId.keys()]) },
      },
      relations: { draftAssociationType: true },
    });

    for (const rule of linkRules) {
      if (!rule.draftAssociationType) {
        continue;
      }
      const newAssocId = draftToAssocId.get(rule.draftAssociationType.id);
      if (!newAssocId) {
        continue;
      }
      rule.associationType = { id: newAssocId } as CrmAssociationType;
      rule.draftAssociationType = null;
    }

    if (linkRules.length > 0) {
      await linkRuleRepo.save(linkRules);
    }
  }

  private toDto(entity: ImportSession): ImportSessionDto {
    return {
      id: entity.id,
      fileId: entity.file?.id ?? '',
      status: entity.status,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
