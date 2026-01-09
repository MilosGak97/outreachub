import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ImportRowResultStatus } from '../../../../enums/import/import-row-result-status.enum';

export class ImportRowResultDto {
  @ApiProperty()
  @IsUUID()
  @IsString()
  id: string;

  @ApiProperty()
  @IsUUID()
  @IsString()
  objectMapId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rowId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rowIndex?: number;

  @ApiProperty({ enum: ImportRowResultStatus, enumName: 'ImportRowResultStatus' })
  @IsEnum(ImportRowResultStatus)
  status: ImportRowResultStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  objectId?: string;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  error?: Record<string, any>;
}
