import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CreateImportPresignDto } from './dto/create-import-presign.dto';
import { ImportPresignResponseDto } from './dto/import-presign-response.dto';
import { randomUUID } from 'crypto';
import { Readable } from 'stream';

@Injectable()
export class ImportStorageService {
  private readonly bucket: string;
  private readonly prefix: string;

  constructor(private readonly s3: S3Client) {
    this.bucket = process.env.IMPORTS_S3_BUCKET || '';
    this.prefix = process.env.IMPORTS_S3_PREFIX || 'imports';
  }

  async createUploadUrl(
    dto: CreateImportPresignDto,
    companyId: string,
  ): Promise<ImportPresignResponseDto> {
    if (!this.bucket) {
      throw new InternalServerErrorException('IMPORTS_S3_BUCKET is not configured');
    }

    if (!companyId) {
      throw new BadRequestException('Company not found');
    }

    if (!this.isCsvFilename(dto.filename)) {
      throw new BadRequestException('Only .csv files are allowed');
    }

    const expiresIn = 600;
    const contentType = this.resolveCsvContentType(dto.contentType);
    const storageKey = this.buildStorageKey(companyId, dto.filename);

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn });

    return {
      uploadUrl,
      storageKey,
      bucket: this.bucket,
      contentType,
      expiresIn,
    };
  }

  async getObjectStream(storageKey: string): Promise<Readable> {
    if (!this.bucket) {
      throw new InternalServerErrorException('IMPORTS_S3_BUCKET is not configured');
    }

    if (!storageKey) {
      throw new BadRequestException('storageKey is required');
    }

    try {
      const response = await this.s3.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
      );

      const body = response.Body as Readable | undefined;

      if (!body || typeof (body as any).pipe !== 'function') {
        throw new InternalServerErrorException('Unable to read import file from storage');
      }

      return body;
    } catch (error: any) {
      if (error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404) {
        throw new BadRequestException('Import file not found in storage');
      }
      throw error;
    }
  }

  private buildStorageKey(companyId: string, filename: string): string {
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '');
    const randomId = randomUUID();
    return `${this.prefix}/${companyId}/${timestamp}-${randomId}-${safeName}`;
  }

  private isCsvFilename(filename: string): boolean {
    return filename.toLowerCase().endsWith('.csv');
  }

  private resolveCsvContentType(contentType?: string): string {
    if (!contentType) {
      return 'text/csv';
    }

    const normalized = contentType.toLowerCase().trim();

    if (normalized === 'application/octet-stream') {
      return 'text/csv';
    }

    const allowed = new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel']);

    if (!allowed.has(normalized)) {
      throw new BadRequestException('Only CSV content types are allowed');
    }

    return normalized;
  }
}
