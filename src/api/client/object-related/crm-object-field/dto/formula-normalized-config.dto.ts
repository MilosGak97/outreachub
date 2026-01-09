import { ApiProperty } from '@nestjs/swagger';
import { FormulaCategory } from '../formula/formula-category.enum';
import { FormulaValidationResultDto } from './formula-validation-result.dto';

export class FormulaNormalizedConfigDto {
  @ApiProperty({ enum: FormulaCategory, enumName: 'FormulaCategory' })
  category: FormulaCategory;

  @ApiProperty({ type: 'object' })
  expressionTree: Record<string, any>;

  @ApiProperty({ type: [String] })
  dependsOnFields: string[];

  @ApiProperty()
  schemaVersion: number;

  @ApiProperty({ type: FormulaValidationResultDto })
  validation: FormulaValidationResultDto;
}

