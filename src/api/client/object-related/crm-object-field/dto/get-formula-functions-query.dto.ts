import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FormulaCategory } from '../formula/formula-category.enum';

export class GetFormulaFunctionsQueryDto {
  @ApiPropertyOptional({ enum: FormulaCategory, enumName: 'FormulaCategory', description: 'Optional category filter' })
  @IsOptional()
  @IsEnum(FormulaCategory)
  category?: FormulaCategory;

  @ApiPropertyOptional({
    description:
      'Optional function name filter (case-insensitive). When provided, the response is either an array with one function or a 400 when not found.',
  })
  @IsOptional()
  @IsString()
  name?: string;
}

