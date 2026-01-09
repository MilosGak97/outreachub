import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ImportFile } from '../../../entities/import/import-file.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';
import { CreateImportFileDto } from '../../../client/object-related/import/dto/create-import-file.dto';
import { ImportFileDto } from '../../../client/object-related/import/dto/import-file.dto';

@Injectable()
export class ImportFileRepository extends BaseCompanyRepository<ImportFile> {
  constructor(
    dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(ImportFile, dataSource, companyContext);
  }

  async createFile(dto: CreateImportFileDto): Promise<ImportFileDto> {
    const file = this.create({
      storageKey: dto.storageKey,
      filename: dto.filename,
      mimeType: dto.mimeType,
      size: dto.size,
      hasHeader: dto.hasHeader ?? true,
      columns: dto.columns ?? [],
      sampleRows: dto.sampleRows ?? [],
      rowCount: dto.rowCount,
    });

    const saved = await this.save(file);
    return this.toDto(saved);
  }

  async getFileById(id: string): Promise<ImportFileDto> {
    const file = await this.findOne({ where: { id } });
    if (!file) {
      throw new BadRequestException('Import file not found');
    }
    return this.toDto(file);
  }

  private toDto(entity: ImportFile): ImportFileDto {
    return {
      id: entity.id,
      storageKey: entity.storageKey,
      filename: entity.filename,
      mimeType: entity.mimeType,
      size: entity.size,
      hasHeader: entity.hasHeader ?? true,
      columns: entity.columns ?? [],
      sampleRows: entity.sampleRows ?? [],
      rowCount: entity.rowCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
