import { BadRequestException, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse';
import { DataSource } from 'typeorm';
import { ImportRow } from '../../../entities/import/import-row.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { ImportSession } from '../../../entities/import/import-session.entity';
import { ImportRowStatus } from '../../../enums/import/import-row-status.enum';
import { ImportStorageService } from '../../../client/object-related/import/import-storage.service';
import { ImportRowsParseResponseDto } from '../../../client/object-related/import/dto/import-rows-parse-response.dto';

@Injectable()
export class ImportRowRepository extends BaseCompanyRepository<ImportRow> {
  constructor(
    dataSource: DataSource,
    companyContext: CompanyContext,
    private readonly importStorageService: ImportStorageService,
  ) {
    super(ImportRow, dataSource, companyContext);
  }

  async parseRowsFromStorage(sessionId: string): Promise<ImportRowsParseResponseDto> {
    const companyId = this.companyContext.currentCompanyId;
    const sessionRepo = this.manager.getRepository(ImportSession);

    const session = await sessionRepo.findOne({
      where: { id: sessionId, company: { id: companyId } },
      relations: { file: true },
    });

    if (!session) {
      throw new BadRequestException('Import session not found');
    }

    const storageKey = session.file?.storageKey;
    if (!storageKey) {
      throw new BadRequestException('Import file is missing storageKey');
    }

    const hasHeader = session.file?.hasHeader ?? true;
    const stream = await this.importStorageService.getObjectStream(storageKey);

    const parser = parse({
      relax_column_count: true,
      bom: true,
      skip_empty_lines: false,
      trim: false,
    });

    stream.pipe(parser);

    const batchSize = 500;
    let rowIndex = 0;
    let isFirstRow = true;

    await this.manager.transaction(async (txManager) => {
      const txRepo = this.withManager(txManager);

      await txRepo.delete({ importSession: { id: sessionId } as ImportSession });

      let batch: ImportRow[] = [];

      for await (const record of parser) {
        if (hasHeader && isFirstRow) {
          isFirstRow = false;
          continue;
        }

        isFirstRow = false;

        const row = txRepo.create({
          importSession: { id: sessionId } as ImportSession,
          rowIndex,
          rowId: `row-${rowIndex}`,
          rawData: Array.isArray(record) ? record : [record],
          status: ImportRowStatus.PENDING,
        });

        batch.push(row);

        if (batch.length >= batchSize) {
          await txRepo.save(batch);
          batch = [];
        }

        rowIndex += 1;
      }

      if (batch.length > 0) {
        await txRepo.save(batch);
      }
    });

    return {
      rowCount: rowIndex,
      hasHeader,
    };
  }
}
