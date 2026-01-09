import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ImportMatchBehavior } from '../../../../enums/import/import-match-behavior.enum';

export class ImportObjectMapDto {
  @ApiProperty()
  @IsUUID()
  @IsString()
  id: string;

  @ApiProperty()
  @IsUUID()
  @IsString()
  objectTypeId: string;

  @ApiProperty({ enum: ImportMatchBehavior, enumName: 'ImportMatchBehavior' })
  @IsEnum(ImportMatchBehavior)
  matchBehavior: ImportMatchBehavior;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  matchFields?: string[];
}
