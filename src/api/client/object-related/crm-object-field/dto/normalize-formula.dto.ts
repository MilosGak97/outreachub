import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsUUID } from 'class-validator';
import { FormulaCategory } from '../formula/formula-category.enum';

export class NormalizeFormulaDto {
  @ApiProperty({
    description:
      'CRM object type id used to derive available fields and their primitive types for validation.',
  })
  @IsUUID()
  objectTypeId: string;

  @ApiProperty({ enum: FormulaCategory, enumName: 'FormulaCategory', description: 'Formula category' })
  @IsEnum(FormulaCategory)
  category: FormulaCategory;

  @ApiProperty({ description: 'Structured formula expression tree (function/field/literal nodes)' })
  @IsObject()
  expressionTree: Record<string, any>;
}
