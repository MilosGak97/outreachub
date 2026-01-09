import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { ImportRowResultStatus } from '../../../../enums/import/import-row-result-status.enum';

export class ImportResultsQueryDto {
  @ApiPropertyOptional({ enum: ImportRowResultStatus, enumName: 'ImportRowResultStatus' })
  @IsOptional()
  @IsEnum(ImportRowResultStatus)
  status?: ImportRowResultStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @IsString()
  objectMapId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset?: number;
}
