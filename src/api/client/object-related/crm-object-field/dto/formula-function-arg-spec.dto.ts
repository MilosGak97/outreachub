import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PrimitiveValueType } from '../formula/primitive-value-type.enum';

export class FormulaFunctionArgSpecDto {
  @ApiProperty({ isArray: true, enum: PrimitiveValueType, enumName: 'PrimitiveValueType' })
  types: PrimitiveValueType[];

  @ApiPropertyOptional()
  optional?: boolean;

  @ApiPropertyOptional()
  variadic?: boolean;
}
