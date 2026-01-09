import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrimitiveValueType } from '../formula/primitive-value-type.enum';

export class FormulaValidationResultDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty({ type: [String] })
  errors: string[];

  @ApiPropertyOptional({ enum: PrimitiveValueType, enumName: 'PrimitiveValueType' })
  inferredType?: PrimitiveValueType;
}

