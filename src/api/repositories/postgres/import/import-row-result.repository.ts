import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ImportRowResult } from '../../../entities/import/import-row-result.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { ImportResultsQueryDto } from '../../../client/object-related/import/dto/import-results-query.dto';
import { ImportRowResultListResponseDto } from '../../../client/object-related/import/dto/import-row-result-list-response.dto';
import { ImportRowResultDto } from '../../../client/object-related/import/dto/import-row-result.dto';

@Injectable()
export class ImportRowResultRepository extends BaseCompanyRepository<ImportRowResult> {
  constructor(
    dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(ImportRowResult, dataSource, companyContext);
  }

  async getResults(
    sessionId: string,
    query: ImportResultsQueryDto,
  ): Promise<ImportRowResultListResponseDto> {
    const companyId = this.companyContext.currentCompanyId;

    const qb = this.createQueryBuilder('result')
      .leftJoinAndSelect('result.row', 'row')
      .leftJoinAndSelect('result.objectMap', 'objectMap')
      .where('result.importSessionId = :sessionId', { sessionId })
      .andWhere('result.companyId = :companyId', { companyId });

    if (query.status) {
      qb.andWhere('result.status = :status', { status: query.status });
    }

    if (query.objectMapId) {
      qb.andWhere('result.objectMapId = :objectMapId', { objectMapId: query.objectMapId });
    }

    const limit = query.limit ?? 100;
    const offset = query.offset ?? 0;

    qb.take(limit);
    qb.skip(offset);

    const [records, totalRecords] = await qb.getManyAndCount();

    const result: ImportRowResultDto[] = records.map((record) => ({
      id: record.id,
      objectMapId: record.objectMap?.id ?? '',
      rowId: record.row?.rowId,
      rowIndex: record.row?.rowIndex,
      status: record.status,
      objectId: record.objectId,
      error: record.error,
    }));

    return {
      result,
      totalRecords,
      limit,
      offset,
    };
  }
}
