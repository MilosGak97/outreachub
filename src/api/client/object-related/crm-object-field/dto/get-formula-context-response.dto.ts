import { ApiProperty } from '@nestjs/swagger';
import { PrimitiveValueType } from '../formula/primitive-value-type.enum';
import { FormulaContextFieldDto } from './formula-context-field.dto';

export class GetFormulaContextResponseDto {
  @ApiProperty({ format: 'uuid' })
  objectTypeId: string;

  @ApiProperty({ type: [FormulaContextFieldDto] })
  fields: FormulaContextFieldDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      type: 'string',
      enum: Object.values(PrimitiveValueType),
    },
    description: 'Map of field apiName -> primitive value type',
  })
  fieldTypes: Record<string, PrimitiveValueType>;
}
