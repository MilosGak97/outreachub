import { ApiProperty } from '@nestjs/swagger';
import { FieldType } from '../../crm-object-field/field-types/field-type.enum';

export class FieldTypeListResponseDto {
  @ApiProperty({
    description: 'Array of supported CRM field types',
    enum: FieldType,
    enumName: 'FieldType',
    isArray: true,
  })
  types: FieldType[];
}
