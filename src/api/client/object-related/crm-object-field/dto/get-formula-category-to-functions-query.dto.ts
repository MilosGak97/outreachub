import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional } from 'class-validator';
import { FormulaCategory } from '../formula/formula-category.enum';

export class GetFormulaCategoryToFunctionsQueryDto {
  @ApiPropertyOptional({
    isArray: true,
    enum: FormulaCategory,
    enumName: 'FormulaCategory',
    description:
      'Optional filter; when omitted, returns mappings for all categories. Supports repeated params (?categories=math&categories=string) or comma-separated (?categories=math,string).',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean);
    }
    return value;
  })
  @IsEnum(FormulaCategory, { each: true })
  categories?: FormulaCategory[];
}
