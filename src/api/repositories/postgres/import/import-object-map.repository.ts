import { BadRequestException, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { DataSource, In } from 'typeorm';
import { ImportObjectMap } from '../../../entities/import/import-object-map.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { UpsertImportObjectMapDto } from '../../../client/object-related/import/dto/upsert-import-object-map.dto';
import { ImportObjectMapDto } from '../../../client/object-related/import/dto/import-object-map.dto';
import { ImportSession } from '../../../entities/import/import-session.entity';
import { CrmObjectType } from '../../../entities/object/crm-object-type.entity';
import { ImportMatchRule } from '../../../entities/import/import-match-rule.entity';
import { ImportMatchBehavior } from '../../../enums/import/import-match-behavior.enum';
import { CrmObjectField } from '../../../entities/object/crm-object-field.entity';

@Injectable()
export class ImportObjectMapRepository extends BaseCompanyRepository<ImportObjectMap> {
  constructor(
    dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(ImportObjectMap, dataSource, companyContext);
  }

  async upsertObjectMaps(
    sessionId: string,
    items: UpsertImportObjectMapDto[],
  ): Promise<ImportObjectMapDto[]> {
    const companyId = this.companyContext.currentCompanyId;
    const sessionRepo = this.manager.getRepository(ImportSession);
    const matchRuleRepo = this.manager.getRepository(ImportMatchRule);

    const session = await sessionRepo.findOne({
      where: { id: sessionId, company: { id: companyId } },
    });

    if (!session) {
      throw new BadRequestException('Import session not found');
    }

    if (items.length === 0) {
      return [];
    }

    const savedMaps: ImportObjectMap[] = [];
    const objectTypeByMapId = new Map<string, string>();

    const objectTypeIds = [...new Set(items.map((item) => item.objectTypeId))];
    const existingMaps = await this.find({
      where: {
        importSession: { id: sessionId },
        objectType: { id: In(objectTypeIds) },
        company: { id: companyId },
      },
      relations: { objectType: true },
    });

    const existingByObjectTypeId = new Map(
      existingMaps.map((map) => [map.objectType?.id ?? '', map]),
    );

    const matchFieldIds = items
      .flatMap((item) => item.matchFields ?? [])
      .filter((value) => value);

    const invalidMatchFields = matchFieldIds.filter((value) => !isUUID(value));
    if (invalidMatchFields.length > 0) {
      throw new BadRequestException(
        `Match fields must be valid UUIDs: ${invalidMatchFields.join(', ')}`,
      );
    }

    const crmFieldRepo = this.manager.getRepository(CrmObjectField);
    const crmFields = matchFieldIds.length
      ? await crmFieldRepo.find({
          where: { id: In(matchFieldIds), company: { id: companyId } },
          relations: { objectType: true },
        })
      : [];
    const crmFieldById = new Map(crmFields.map((field) => [field.id, field]));

    for (const item of items) {
      let map = existingByObjectTypeId.get(item.objectTypeId);
      let shouldSave = false;

      if (item.matchFields && item.matchFields.length > 0) {
        for (const fieldId of item.matchFields) {
          const field = crmFieldById.get(fieldId);
          if (!field) {
            throw new BadRequestException(`Match field '${fieldId}' was not found`);
          }
          if (field.objectType?.id !== item.objectTypeId) {
            throw new BadRequestException(
              `Match field '${fieldId}' does not belong to the mapped object type`,
            );
          }
        }
      }

      if (!map) {
        map = this.create({
          importSession: { id: sessionId } as ImportSession,
          objectType: { id: item.objectTypeId } as CrmObjectType,
          matchBehavior: item.matchBehavior ?? ImportMatchBehavior.CREATE,
        });
        shouldSave = true;
      } else if (item.matchBehavior !== undefined && map.matchBehavior !== item.matchBehavior) {
        map.matchBehavior = item.matchBehavior;
        shouldSave = true;
      }

      const saved = shouldSave ? await this.save(map) : map;
      savedMaps.push(saved);
      objectTypeByMapId.set(saved.id, item.objectTypeId);

      if (item.matchFields !== undefined) {
        const existingRule = await matchRuleRepo.findOne({
          where: { objectMap: { id: saved.id }, company: { id: companyId } },
        });

        if (!item.matchFields || item.matchFields.length === 0) {
          if (existingRule) {
            await matchRuleRepo.remove(existingRule);
          }
        } else {
          const nextMatchFields = this.mergeStringArrays(
            existingRule?.matchFields ?? [],
            item.matchFields,
          );

          if (existingRule) {
            if (!this.areStringArraysEqual(existingRule.matchFields, nextMatchFields)) {
              existingRule.matchFields = nextMatchFields;
              await matchRuleRepo.save(existingRule);
            }
          } else {
            const rule = matchRuleRepo.create({
              objectMap: { id: saved.id },
              matchFields: nextMatchFields,
              company: { id: companyId },
            });
            await matchRuleRepo.save(rule);
          }
        }
      }
    }

    const rules = await matchRuleRepo.find({
      where: {
        company: { id: companyId },
        objectMap: { id: In(savedMaps.map((map) => map.id)) },
      },
      relations: { objectMap: true },
    });

    const rulesByMapId = new Map(
      rules.map((rule) => [rule.objectMap.id, rule.matchFields ?? []]),
    );

    return savedMaps.map((map) => ({
      id: map.id,
      objectTypeId: objectTypeByMapId.get(map.id) ?? map.objectType?.id ?? '',
      matchBehavior: map.matchBehavior,
      matchFields: rulesByMapId.get(map.id),
    }));
  }

  async removeMatchField(
    sessionId: string,
    objectMapId: string,
    fieldId: string,
  ): Promise<ImportObjectMapDto> {
    const companyId = this.companyContext.currentCompanyId;
    const matchRuleRepo = this.manager.getRepository(ImportMatchRule);
    const crmFieldRepo = this.manager.getRepository(CrmObjectField);

    const objectMap = await this.findOne({
      where: {
        id: objectMapId,
        importSession: { id: sessionId },
        company: { id: companyId },
      },
      relations: { objectType: true },
    });

    if (!objectMap) {
      throw new BadRequestException('Object map not found');
    }

    const field = await crmFieldRepo.findOne({
      where: { id: fieldId, company: { id: companyId } },
      relations: { objectType: true },
    });

    if (!field) {
      throw new BadRequestException(`Match field '${fieldId}' was not found`);
    }

    if (field.objectType?.id !== objectMap.objectType?.id) {
      throw new BadRequestException(
        `Match field '${fieldId}' does not belong to the mapped object type`,
      );
    }

    const existingRule = await matchRuleRepo.findOne({
      where: { objectMap: { id: objectMapId }, company: { id: companyId } },
    });

    if (existingRule) {
      const nextMatchFields = (existingRule.matchFields ?? []).filter(
        (value) => value !== fieldId,
      );

      if (nextMatchFields.length === 0) {
        await matchRuleRepo.remove(existingRule);
      } else if (!this.areStringArraysEqual(existingRule.matchFields, nextMatchFields)) {
        existingRule.matchFields = nextMatchFields;
        await matchRuleRepo.save(existingRule);
      }
    }

    const updatedRule = await matchRuleRepo.findOne({
      where: { objectMap: { id: objectMapId }, company: { id: companyId } },
    });

    return {
      id: objectMap.id,
      objectTypeId: objectMap.objectType?.id ?? '',
      matchBehavior: objectMap.matchBehavior,
      matchFields: updatedRule?.matchFields,
    };
  }

  private areStringArraysEqual(left: string[] = [], right: string[] = []): boolean {
    if (left.length !== right.length) {
      return false;
    }

    const leftSorted = [...left].sort();
    const rightSorted = [...right].sort();

    return leftSorted.every((value, index) => value === rightSorted[index]);
  }

  private mergeStringArrays(left: string[] = [], right: string[] = []): string[] {
    const merged: string[] = [];
    const seen = new Set<string>();

    for (const value of [...left, ...right]) {
      if (!value || seen.has(value)) {
        continue;
      }
      seen.add(value);
      merged.push(value);
    }

    return merged;
  }
}
