import { ApiProperty } from '@nestjs/swagger';
import { FormulaCategory } from '../formula/formula-category.enum';
import { PrimitiveValueType } from '../formula/primitive-value-type.enum';
import { FormulaFunctionArgSpecDto } from './formula-function-arg-spec.dto';

export class FormulaFunctionDefinitionDto {
  @ApiProperty()
  name: string;

  @ApiProperty({ description: 'Customer-facing description of what the function does' })
  description: string;

  @ApiProperty({ enum: FormulaCategory, enumName: 'FormulaCategory' })
  category: FormulaCategory;

  @ApiProperty({ enum: PrimitiveValueType, enumName: 'PrimitiveValueType' })
  returnType: PrimitiveValueType;

  @ApiProperty({ type: [FormulaFunctionArgSpecDto] })
  args: FormulaFunctionArgSpecDto[];
}
