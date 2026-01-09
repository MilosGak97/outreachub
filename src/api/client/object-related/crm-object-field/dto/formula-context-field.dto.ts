import { ApiProperty } from '@nestjs/swagger';
import { FieldType } from '../field-types/field-type.enum';
import { PrimitiveValueType } from '../formula/primitive-value-type.enum';

export class FormulaContextFieldDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  apiName: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: FieldType, enumName: 'FieldType' })
  fieldType: FieldType;

  @ApiProperty({ enum: PrimitiveValueType, enumName: 'PrimitiveValueType' })
  primitiveType: PrimitiveValueType;
}

