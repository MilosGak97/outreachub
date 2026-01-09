import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { ImportFieldMap } from '../../../entities/import/import-field-map.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { UpsertImportFieldMapDto } from '../../../client/object-related/import/dto/upsert-import-field-map.dto';
import { ImportFieldMapDto } from '../../../client/object-related/import/dto/import-field-map.dto';
import { ImportObjectMap } from '../../../entities/import/import-object-map.entity';
import { ImportDraftField } from '../../../entities/import/import-draft-field.entity';
import { CrmObjectField } from '../../../entities/object/crm-object-field.entity';

@Injectable()
export class ImportFieldMapRepository extends BaseCompanyRepository<ImportFieldMap> {
  constructor(
    dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(ImportFieldMap, dataSource, companyContext);
  }

  async replaceFieldMaps(
    sessionId: string,
    items: UpsertImportFieldMapDto[],
  ): Promise<ImportFieldMapDto[]> {
    const companyId = this.companyContext.currentCompanyId;

    if (items.length === 0) {
      return [];
    }

    const objectMapIds = [...new Set(items.map((item) => item.objectMapId))];
    const objectMapRepo = this.manager.getRepository(ImportObjectMap);

    const validMaps = await objectMapRepo.find({
      where: {
        id: In(objectMapIds),
        importSession: { id: sessionId },
        company: { id: companyId },
      },
      relations: { objectType: true },
    });

    if (validMaps.length !== objectMapIds.length) {
      throw new BadRequestException('One or more object maps are invalid');
    }

    const objectTypeByMapId = new Map(
      validMaps.map((map) => [map.id, map.objectType?.id ?? '']),
    );

    const targetFieldIds = items
      .map((item) => item.targetFieldId)
      .filter((value): value is string => Boolean(value));
    const draftFieldIds = items
      .map((item) => item.draftFieldId)
      .filter((value): value is string => Boolean(value));

    const crmFieldRepo = this.manager.getRepository(CrmObjectField);
    const draftFieldRepo = this.manager.getRepository(ImportDraftField);

    const [crmFields, draftFields] = await Promise.all([
      targetFieldIds.length
        ? crmFieldRepo.find({
            where: { id: In(targetFieldIds), company: { id: companyId } },
            relations: { objectType: true },
          })
        : Promise.resolve([]),
      draftFieldIds.length
        ? draftFieldRepo.find({
            where: {
              id: In(draftFieldIds),
              company: { id: companyId },
              importSession: { id: sessionId },
            },
            relations: { objectType: true },
          })
        : Promise.resolve([]),
    ]);

    const crmFieldById = new Map(crmFields.map((field) => [field.id, field]));
    const draftFieldById = new Map(draftFields.map((field) => [field.id, field]));

    for (const item of items) {
      if (!item.targetFieldId && !item.draftFieldId) {
        throw new BadRequestException(
          `Field map for column index '${item.sourceIndex}' must target a field`,
        );
      }

      if (item.targetFieldId && item.draftFieldId) {
        throw new BadRequestException(
          `Field map for column index '${item.sourceIndex}' cannot target both a draft and existing field`,
        );
      }

      const objectTypeId = objectTypeByMapId.get(item.objectMapId);
      if (!objectTypeId) {
        throw new BadRequestException('One or more object maps are invalid');
      }

      if (item.targetFieldId) {
        const field = crmFieldById.get(item.targetFieldId);
        if (!field) {
          throw new BadRequestException(
            `Target field '${item.targetFieldId}' was not found`,
          );
        }
        if (field.objectType?.id !== objectTypeId) {
          throw new BadRequestException(
            `Target field '${item.targetFieldId}' does not belong to the mapped object type`,
          );
        }
      }

      if (item.draftFieldId) {
        const field = draftFieldById.get(item.draftFieldId);
        if (!field) {
          throw new BadRequestException(
            `Draft field '${item.draftFieldId}' was not found`,
          );
        }
        if (field.objectType?.id !== objectTypeId) {
          throw new BadRequestException(
            `Draft field '${item.draftFieldId}' does not belong to the mapped object type`,
          );
        }
      }
    }

    const saved = await this.manager.transaction(async (txManager) => {
      const txRepo = this.withManager(txManager);

      for (const mapId of objectMapIds) {
        await txRepo.delete({ objectMap: { id: mapId } as ImportObjectMap });
      }

      const newMaps = items.map((item) =>
        txRepo.create({
          objectMap: { id: item.objectMapId } as ImportObjectMap,
          sourceIndex: item.sourceIndex,
          targetField: item.targetFieldId
            ? ({ id: item.targetFieldId } as CrmObjectField)
            : undefined,
          draftField: item.draftFieldId
            ? ({ id: item.draftFieldId } as ImportDraftField)
            : undefined,
          defaultValue: item.defaultValue,
          transformRule: item.transformRule,
        }),
      );

      return txRepo.save(newMaps);
    });

    return saved.map((map) => ({
      id: map.id,
      objectMapId: map.objectMap?.id ?? '',
      sourceIndex: map.sourceIndex,
      targetFieldId: map.targetField?.id,
      draftFieldId: map.draftField?.id,
      defaultValue: map.defaultValue,
      transformRule: map.transformRule,
    }));
  }
}
