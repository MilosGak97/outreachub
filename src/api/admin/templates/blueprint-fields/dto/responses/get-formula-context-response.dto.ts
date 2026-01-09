import { ApiProperty } from '@nestjs/swagger';
import { FieldType } from '../../../../../client/object-related/crm-object-field/field-types/field-type.enum';
import { PrimitiveValueType } from '../../../../../client/object-related/crm-object-field/formula/primitive-value-type.enum';

export class FormulaContextFieldDto {
  @ApiProperty({ description: 'Field UUID' })
  id: string;

  @ApiProperty({ description: 'Field API name' })
  apiName: string;

  @ApiProperty({ description: 'Field display name' })
  name: string;

  @ApiProperty({ description: 'Field type', enum: FieldType })
  fieldType: FieldType;

  @ApiProperty({ description: 'Primitive type for formula evaluation', enum: PrimitiveValueType })
  primitiveType: PrimitiveValueType;
}

export class GetFormulaContextResponseDto {
  @ApiProperty({
    description: 'The blueprint object ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  blueprintObjectId: string;

  @ApiProperty({
    description: 'List of fields usable in formulas',
    type: [FormulaContextFieldDto],
  })
  fields: FormulaContextFieldDto[];

  @ApiProperty({
    description: 'Mapping of field apiName to primitive type (for formula validation)',
    example: {
      '_price': 'number',
      '_quantity': 'number',
      '_name': 'string',
    },
  })
  fieldTypes: Record<string, PrimitiveValueType>;
}
