import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ImportJob } from '../../../entities/import/import-job.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { ImportJobDto } from '../../../client/object-related/import/dto/import-job.dto';
import { ImportSession } from '../../../entities/import/import-session.entity';
import { ImportJobStatus } from '../../../enums/import/import-job-status.enum';

@Injectable()
export class ImportJobRepository extends BaseCompanyRepository<ImportJob> {
  constructor(
    dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(ImportJob, dataSource, companyContext);
  }

  async createJob(sessionId: string): Promise<ImportJobDto> {
    const companyId = this.companyContext.currentCompanyId;
    const sessionRepo = this.manager.getRepository(ImportSession);

    const session = await sessionRepo.findOne({
      where: { id: sessionId, company: { id: companyId } },
    });

    if (!session) {
      throw new BadRequestException('Import session not found');
    }

    const job = this.create({
      importSession: { id: sessionId } as ImportSession,
      status: ImportJobStatus.QUEUED,
    });

    const saved = await this.save(job);
    return this.toDto(saved);
  }

  async getJob(sessionId: string, jobId: string): Promise<ImportJobDto> {
    const job = await this.findOne({
      where: { id: jobId, importSession: { id: sessionId } },
    });

    if (!job) {
      throw new BadRequestException('Import job not found');
    }

    return this.toDto(job);
  }

  private toDto(entity: ImportJob): ImportJobDto {
    return {
      id: entity.id,
      status: entity.status,
      startedAt: entity.startedAt,
      finishedAt: entity.finishedAt,
      createdCount: entity.createdCount,
      updatedCount: entity.updatedCount,
      skippedCount: entity.skippedCount,
      linkedCount: entity.linkedCount,
      errorReportKey: entity.errorReportKey,
    };
  }
}
