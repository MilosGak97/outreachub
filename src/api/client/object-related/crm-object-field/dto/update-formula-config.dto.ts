import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { FormulaCategory } from '../formula/formula-category.enum';

export class UpdateFormulaConfigDto {
  @ApiPropertyOptional({ enum: FormulaCategory, enumName: 'FormulaCategory', description: 'Formula category' })
  @IsOptional()
  @IsEnum(FormulaCategory)
  category?: FormulaCategory;

  @ApiProperty({ description: 'Structured formula expression tree (function/field/literal nodes)' })
  @IsObject()
  expressionTree: Record<string, any>;
}
