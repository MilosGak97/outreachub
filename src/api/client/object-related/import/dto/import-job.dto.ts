import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ImportJobStatus } from '../../../../enums/import/import-job-status.enum';

export class ImportJobDto {
  @ApiProperty()
  @IsUUID()
  @IsString()
  id: string;

  @ApiProperty({ enum: ImportJobStatus, enumName: 'ImportJobStatus' })
  @IsEnum(ImportJobStatus)
  status: ImportJobStatus;

  @ApiPropertyOptional()
  @IsOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  finishedAt?: Date;

  @ApiProperty()
  @IsNumber()
  createdCount: number;

  @ApiProperty()
  @IsNumber()
  updatedCount: number;

  @ApiProperty()
  @IsNumber()
  skippedCount: number;

  @ApiProperty()
  @IsNumber()
  linkedCount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  errorReportKey?: string;
}
