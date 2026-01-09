import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateImportFileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storageKey?: string;

  @ApiProperty()
  @IsString()
  filename: string;

  @ApiProperty()
  @IsString()
  mimeType: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  size: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  hasHeader?: boolean;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  columns: string[];

  @ApiProperty({
    type: [Object],
    description: 'Sample rows as arrays of column values',
  })
  @IsArray()
  @IsArray({ each: true })
  sampleRows: any[][];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rowCount?: number;
}
