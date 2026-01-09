import { ApiProperty } from '@nestjs/swagger';
import { FieldType } from '../../crm-object-field/field-types/field-type.enum';
import { FieldSchemaDefinition } from '../../crm-object-field/field-types/base-field.interface';

export class FieldTypeDefinitionDto {
  @ApiProperty({ enum: FieldType, enumName: 'FieldType' })
  type: FieldType;

  @ApiProperty()
  label: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ required: false, type: 'object' })
  shape?: Record<string, FieldSchemaDefinition>;

  @ApiProperty({ required: false, type: 'object' })
  configShape?: Record<string, FieldSchemaDefinition>;

  @ApiProperty({ required: false, description: 'Whether this field type can be configured as a formula output' })
  isFormulaCapable?: boolean;

  @ApiProperty({ required: false, description: 'Whether fields of this type can be referenced inside formulas' })
  isUsableInFormula?: boolean;
}
