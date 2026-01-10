import { ApiProperty } from '@nestjs/swagger';
import { ProtectedFieldActionResponseDto } from './protected-field-action-response.dto';
import { FieldType } from '../../../crm-object-field/field-types/field-type.enum';

export class ProtectedFieldValueResponseDto {
  @ApiProperty({
    enum: FieldType,
    enumName: 'FieldType',
    example: FieldType.PROTECTED_PHONE,
    description: 'The protected field type',
  })
  type: FieldType;

  @ApiProperty({ example: true, description: 'Always true for protected fields' })
  protected: true;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Reference to protected value' })
  valueId: string;

  @ApiProperty({ example: '+1 ****** 9876', description: 'Masked display value' })
  display: string;

  @ApiProperty({ type: [ProtectedFieldActionResponseDto], description: 'Available actions for this field' })
  actions: ProtectedFieldActionResponseDto[];

  @ApiProperty({ example: false, description: 'Whether this value can be revealed (always false)' })
  revealable: false;
}
