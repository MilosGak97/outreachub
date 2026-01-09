import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ImportMatchBehavior } from '../../../../enums/import/import-match-behavior.enum';

const toStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  const rawValues = Array.isArray(value) ? value : value.toString().split(',');
  const normalized = rawValues.map((v) => (v ?? '').toString().trim()).filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
};

export class UpsertImportObjectMapDto {
  @ApiProperty()
  @IsUUID()
  @IsString()
  objectTypeId: string;

  @ApiPropertyOptional({
    enum: ImportMatchBehavior,
    enumName: 'ImportMatchBehavior',
    description: 'Defaults to CREATE when omitted',
  })
  @IsOptional()
  @IsEnum(ImportMatchBehavior)
  matchBehavior?: ImportMatchBehavior;

  @ApiPropertyOptional({
    type: [String],
    description: 'Adds to existing match fields (no replacement)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsString({ each: true })
  @Transform(({ value }) => toStringArray(value), { toClassOnly: true })
  matchFields?: string[];
}
