import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class UpsertImportFieldMapDto {
  @ApiProperty()
  @IsUUID()
  @IsString()
  objectMapId: string;

  @ApiProperty({ description: '0-based index of the CSV column' })
  @Type(() => Number)
  @IsNumber()
  sourceIndex: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @IsString()
  targetFieldId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @IsString()
  draftFieldId?: string;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  defaultValue?: Record<string, any>;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  transformRule?: Record<string, any>;
}
