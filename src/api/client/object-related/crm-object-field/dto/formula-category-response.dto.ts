import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum } from 'class-validator';
import { FormulaCategory } from '../formula/formula-types';

export class FormulaCategoryResponseDto{
  @ApiProperty({
    isArray: true,
    enum: FormulaCategory,
    enumName: 'FormulaCategory'
  })
  @IsEnum(FormulaCategory, {each: true})
  @IsArray()
  values: FormulaCategory[]
}