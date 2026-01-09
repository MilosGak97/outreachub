import { BadRequestException, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { DataSource, In } from 'typeorm';
import { ImportLinkRule } from '../../../entities/import/import-link-rule.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { UpsertImportLinkRuleDto } from '../../../client/object-related/import/dto/upsert-import-link-rule.dto';
import { ImportLinkRuleDto } from '../../../client/object-related/import/dto/import-link-rule.dto';
import { UpdateImportLinkRuleDto } from '../../../client/object-related/import/dto/update-import-link-rule.dto';
import { ImportSession } from '../../../entities/import/import-session.entity';
import { CrmAssociationType } from '../../../entities/object/crm-association-type.entity';
import { ImportDraftAssociationType } from '../../../entities/import/import-draft-association-type.entity';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';
import { CrmObjectField } from '../../../entities/object/crm-object-field.entity';
import { ImportLinkMode } from '../../../enums/import/import-link-mode.enum';

@Injectable()
export class ImportLinkRuleRepository extends BaseCompanyRepository<ImportLinkRule> {
  constructor(
    dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(ImportLinkRule, dataSource, companyContext);
  }

  async addLinkRules(
    sessionId: string,
    items: UpsertImportLinkRuleDto[],
  ): Promise<ImportLinkRuleDto[]> {
    const companyId = this.companyContext.currentCompanyId;
    const sessionRepo = this.manager.getRepository(ImportSession);

    const session = await sessionRepo.findOne({
      where: { id: sessionId, company: { id: companyId } },
    });

    if (!session) {
      throw new BadRequestException('Import session not found');
    }

    if (items.length === 0) {
      return [];
    }

    await this.validateAndLoadContext(sessionId, companyId, items);
    await this.ensureNoDuplicateRules(sessionId, companyId, items);

    const saved = await this.manager.transaction(async (txManager) => {
      const txRepo = this.withManager(txManager);

      const newRules = items.map((item) =>
        txRepo.create({
          importSession: { id: sessionId } as ImportSession,
          mode: item.mode,
          associationType: item.associationTypeId
            ? ({ id: item.associationTypeId } as CrmAssociationType)
            : undefined,
          draftAssociationType: item.draftAssociationTypeId
            ? ({ id: item.draftAssociationTypeId } as ImportDraftAssociationType)
            : undefined,
          sourceObjectType: item.sourceObjectTypeId
            ? ({ id: item.sourceObjectTypeId } as CrmObjectType)
            : undefined,
          targetObjectType: item.targetObjectTypeId
            ? ({ id: item.targetObjectTypeId } as CrmObjectType)
            : undefined,
          sourceMatchField: item.sourceMatchField,
          targetMatchField: item.targetMatchField,
        }),
      );

      return txRepo.save(newRules);
    });

    return saved.map((rule) => ({
      id: rule.id,
      mode: rule.mode,
      associationTypeId: rule.associationType?.id,
      draftAssociationTypeId: rule.draftAssociationType?.id,
      sourceObjectTypeId: rule.sourceObjectType?.id,
      targetObjectTypeId: rule.targetObjectType?.id,
      sourceMatchField: rule.sourceMatchField,
      targetMatchField: rule.targetMatchField,
    }));
  }

  async updateLinkRule(
    sessionId: string,
    ruleId: string,
    dto: UpdateImportLinkRuleDto,
  ): Promise<ImportLinkRuleDto> {
    const companyId = this.companyContext.currentCompanyId;
    const sessionRepo = this.manager.getRepository(ImportSession);

    const session = await sessionRepo.findOne({
      where: { id: sessionId, company: { id: companyId } },
    });

    if (!session) {
      throw new BadRequestException('Import session not found');
    }

    const rule = await this.findOne({
      where: { id: ruleId, importSession: { id: sessionId }, company: { id: companyId } },
      relations: {
        associationType: true,
        draftAssociationType: true,
        sourceObjectType: true,
        targetObjectType: true,
      },
    });

    if (!rule) {
      throw new BadRequestException('Link rule not found');
    }

    const effective = this.mergeRuleUpdate(rule, dto);

    await this.validateAndLoadContext(sessionId, companyId, [effective]);
    await this.ensureNoDuplicateRules(sessionId, companyId, [effective], ruleId);

    rule.mode = effective.mode;
    rule.associationType = effective.associationTypeId
      ? ({ id: effective.associationTypeId } as CrmAssociationType)
      : null;
    rule.draftAssociationType = effective.draftAssociationTypeId
      ? ({ id: effective.draftAssociationTypeId } as ImportDraftAssociationType)
      : null;
    rule.sourceObjectType = effective.sourceObjectTypeId
      ? ({ id: effective.sourceObjectTypeId } as CrmObjectType)
      : null;
    rule.targetObjectType = effective.targetObjectTypeId
      ? ({ id: effective.targetObjectTypeId } as CrmObjectType)
      : null;
    rule.sourceMatchField = effective.sourceMatchField;
    rule.targetMatchField = effective.targetMatchField;

    const saved = await this.save(rule);

    return {
      id: saved.id,
      mode: saved.mode,
      associationTypeId: saved.associationType?.id,
      draftAssociationTypeId: saved.draftAssociationType?.id,
      sourceObjectTypeId: saved.sourceObjectType?.id,
      targetObjectTypeId: saved.targetObjectType?.id,
      sourceMatchField: saved.sourceMatchField,
      targetMatchField: saved.targetMatchField,
    };
  }

  async deleteLinkRule(sessionId: string, ruleId: string): Promise<void> {
    const companyId = this.companyContext.currentCompanyId;
    const sessionRepo = this.manager.getRepository(ImportSession);

    const session = await sessionRepo.findOne({
      where: { id: sessionId, company: { id: companyId } },
    });

    if (!session) {
      throw new BadRequestException('Import session not found');
    }

    const rule = await this.findOne({
      where: { id: ruleId, importSession: { id: sessionId }, company: { id: companyId } },
    });

    if (!rule) {
      throw new BadRequestException('Link rule not found');
    }

    await this.remove(rule);
  }

  private validateLinkRulePayload(items: UpsertImportLinkRuleDto[]): void {
    for (const item of items) {
      if (item.associationTypeId && item.draftAssociationTypeId) {
        throw new BadRequestException(
          'Provide either associationTypeId or draftAssociationTypeId, not both',
        );
      }

      if (item.mode !== ImportLinkMode.SKIP && !item.associationTypeId && !item.draftAssociationTypeId) {
        throw new BadRequestException('Association type is required unless mode is SKIP');
      }

      if (item.mode === ImportLinkMode.ROW || item.mode === ImportLinkMode.FIELD) {
        if (!item.sourceObjectTypeId || !item.targetObjectTypeId) {
          throw new BadRequestException('Source and target object types are required');
        }
      }

      if (item.mode === ImportLinkMode.FIELD) {
        if (!item.sourceMatchField || !item.targetMatchField) {
          throw new BadRequestException('Match fields are required for FIELD mode');
        }
      }
    }
  }

  private mergeRuleUpdate(
    rule: ImportLinkRule,
    dto: UpdateImportLinkRuleDto,
  ): UpsertImportLinkRuleDto {
    if (dto.associationTypeId !== undefined && dto.draftAssociationTypeId !== undefined) {
      throw new BadRequestException(
        'Provide either associationTypeId or draftAssociationTypeId, not both',
      );
    }

    const mode = dto.mode ?? rule.mode;

    let associationTypeId = rule.associationType?.id;
    let draftAssociationTypeId = rule.draftAssociationType?.id;

    if (dto.associationTypeId !== undefined) {
      associationTypeId = dto.associationTypeId;
      draftAssociationTypeId = undefined;
    } else if (dto.draftAssociationTypeId !== undefined) {
      draftAssociationTypeId = dto.draftAssociationTypeId;
      associationTypeId = undefined;
    }

    return {
      mode,
      associationTypeId,
      draftAssociationTypeId,
      sourceObjectTypeId: dto.sourceObjectTypeId ?? rule.sourceObjectType?.id,
      targetObjectTypeId: dto.targetObjectTypeId ?? rule.targetObjectType?.id,
      sourceMatchField: dto.sourceMatchField ?? rule.sourceMatchField,
      targetMatchField: dto.targetMatchField ?? rule.targetMatchField,
    };
  }

  private async validateAndLoadContext(
    sessionId: string,
    companyId: string,
    items: UpsertImportLinkRuleDto[],
  ): Promise<void> {
    this.validateLinkRulePayload(items);

    const associationTypeIds = this.uniqueIds(
      items.map((item) => item.associationTypeId),
    );
    const draftAssociationTypeIds = this.uniqueIds(
      items.map((item) => item.draftAssociationTypeId),
    );
    const objectTypeIds = this.uniqueIds(
      items.flatMap((item) => [item.sourceObjectTypeId, item.targetObjectTypeId]),
    );
    const matchFieldIds = this.uniqueIds(
      items.flatMap((item) => [item.sourceMatchField, item.targetMatchField]),
    );

    this.validateUuidList('associationTypeId', associationTypeIds);
    this.validateUuidList('draftAssociationTypeId', draftAssociationTypeIds);
    this.validateUuidList('source/target object type id', objectTypeIds);
    this.validateUuidList('match field id', matchFieldIds);

    const [associationTypes, draftAssociationTypes, objectTypes, matchFields] = await Promise.all([
      associationTypeIds.length
        ? this.manager.getRepository(CrmAssociationType).find({
            where: { id: In(associationTypeIds), company: { id: companyId } },
            relations: { sourceObjectType: true, targetObjectType: true },
          })
        : Promise.resolve([]),
      draftAssociationTypeIds.length
        ? this.manager.getRepository(ImportDraftAssociationType).find({
            where: {
              id: In(draftAssociationTypeIds),
              company: { id: companyId },
              importSession: { id: sessionId },
            },
            relations: { sourceObjectType: true, targetObjectType: true },
          })
        : Promise.resolve([]),
      objectTypeIds.length
        ? this.manager.getRepository(CrmObjectType).find({
            where: { id: In(objectTypeIds), company: { id: companyId } },
          })
        : Promise.resolve([]),
      matchFieldIds.length
        ? this.manager.getRepository(CrmObjectField).find({
            where: { id: In(matchFieldIds), company: { id: companyId } },
            relations: { objectType: true },
          })
        : Promise.resolve([]),
    ]);

    const associationById = new Map(associationTypes.map((assoc) => [assoc.id, assoc]));
    const draftAssociationById = new Map(
      draftAssociationTypes.map((assoc) => [assoc.id, assoc]),
    );
    const objectTypeById = new Map(objectTypes.map((type) => [type.id, type]));
    const matchFieldById = new Map(matchFields.map((field) => [field.id, field]));

    this.ensureAllFound('Association type', associationTypeIds, associationById);
    this.ensureAllFound('Draft association type', draftAssociationTypeIds, draftAssociationById);
    this.ensureAllFound('Object type', objectTypeIds, objectTypeById);
    this.ensureAllFound('Match field', matchFieldIds, matchFieldById);

    for (const item of items) {
      const assoc = item.associationTypeId
        ? associationById.get(item.associationTypeId)
        : item.draftAssociationTypeId
          ? draftAssociationById.get(item.draftAssociationTypeId)
          : undefined;

      if (assoc) {
        const sourceId = assoc.sourceObjectType?.id;
        const targetId = assoc.targetObjectType?.id;

        if (item.sourceObjectTypeId && sourceId && item.sourceObjectTypeId !== sourceId) {
          throw new BadRequestException(
            `Source object type '${item.sourceObjectTypeId}' does not match association type`,
          );
        }

        if (item.targetObjectTypeId && targetId && item.targetObjectTypeId !== targetId) {
          throw new BadRequestException(
            `Target object type '${item.targetObjectTypeId}' does not match association type`,
          );
        }
      }

      if (item.mode === ImportLinkMode.FIELD) {
        const sourceField = item.sourceMatchField
          ? matchFieldById.get(item.sourceMatchField)
          : undefined;
        const targetField = item.targetMatchField
          ? matchFieldById.get(item.targetMatchField)
          : undefined;

        if (!sourceField || !targetField) {
          throw new BadRequestException('Match fields are required for FIELD mode');
        }

        if (sourceField.objectType?.id !== item.sourceObjectTypeId) {
          throw new BadRequestException(
            `Source match field '${item.sourceMatchField}' does not belong to the source object type`,
          );
        }

        if (targetField.objectType?.id !== item.targetObjectTypeId) {
          throw new BadRequestException(
            `Target match field '${item.targetMatchField}' does not belong to the target object type`,
          );
        }
      }
    }
  }

  private uniqueIds(values: Array<string | undefined>): string[] {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
  }

  private validateUuidList(label: string, values: string[]): void {
    const invalid = values.filter((value) => !isUUID(value));
    if (invalid.length > 0) {
      throw new BadRequestException(`${label} must be valid UUIDs: ${invalid.join(', ')}`);
    }
  }

  private ensureAllFound<T>(
    label: string,
    expectedIds: string[],
    foundById: Map<string, T>,
  ): void {
    const missing = expectedIds.filter((id) => !foundById.has(id));
    if (missing.length > 0) {
      throw new BadRequestException(`${label} not found: ${missing.join(', ')}`);
    }
  }

  private async ensureNoDuplicateRules(
    sessionId: string,
    companyId: string,
    items: UpsertImportLinkRuleDto[],
    excludeRuleId?: string,
  ): Promise<void> {
    const existingRules = await this.find({
      where: { importSession: { id: sessionId }, company: { id: companyId } },
      relations: {
        associationType: true,
        draftAssociationType: true,
        sourceObjectType: true,
        targetObjectType: true,
      },
    });

    const existingKeys = new Set(
      existingRules
        .filter((rule) => rule.id !== excludeRuleId)
        .map((rule) =>
          this.buildLinkKey({
            associationTypeId: rule.associationType?.id,
            draftAssociationTypeId: rule.draftAssociationType?.id,
            sourceObjectTypeId: rule.sourceObjectType?.id,
            targetObjectTypeId: rule.targetObjectType?.id,
          }),
        )
        .filter((key): key is string => Boolean(key)),
    );

    const incomingKeys = new Set<string>();

    for (const item of items) {
      const key = this.buildLinkKey(item);
      if (!key) {
        continue;
      }

      if (existingKeys.has(key)) {
        throw new BadRequestException(
          'A link rule already exists for this association type and object types',
        );
      }

      if (incomingKeys.has(key)) {
        throw new BadRequestException(
          'Duplicate link rules detected for the same association type and object types',
        );
      }

      incomingKeys.add(key);
    }
  }

  private buildLinkKey({
    associationTypeId,
    draftAssociationTypeId,
    sourceObjectTypeId,
    targetObjectTypeId,
  }: {
    associationTypeId?: string;
    draftAssociationTypeId?: string;
    sourceObjectTypeId?: string;
    targetObjectTypeId?: string;
  }): string | null {
    const assocId = associationTypeId ?? draftAssociationTypeId;
    if (!assocId || !sourceObjectTypeId || !targetObjectTypeId) {
      return null;
    }

    const assocPrefix = associationTypeId ? 'assoc' : 'draft';
    return `${assocPrefix}:${assocId}|${sourceObjectTypeId}|${targetObjectTypeId}`;
  }
}
