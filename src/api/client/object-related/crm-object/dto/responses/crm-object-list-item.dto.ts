import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FieldType } from '../../../crm-object-field/field-types/field-type.enum';

export class CrmObjectListFieldValueDto {
  @ApiProperty({
    description: 'Field ID',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  fieldId: string;

  @ApiProperty({
    description: 'Field API name',
    example: 'email',
  })
  apiName: string;

  @ApiProperty({
    description: 'Field display name',
    example: 'Email Address',
  })
  name: string;

  @ApiProperty({
    description: 'Field type',
    enum: FieldType,
    enumName: 'FieldType',
  })
  fieldType: FieldType;

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
  })
  isRequired: boolean;

  @ApiPropertyOptional({
    description: 'Current value of the field',
    example: 'john@example.com',
  })
  value?: any;
}

export class CrmObjectListItemDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Display name of the object',
    example: 'John Doe',
  })
  displayName: string;

  @ApiProperty({
    description: 'Field values with metadata for list display',
    type: [CrmObjectListFieldValueDto],
    example: [
      {
        fieldId: '770e8400-e29b-41d4-a716-446655440000',
        apiName: 'email',
        name: 'Email Address',
        fieldType: 'string',
        isRequired: true,
        value: 'john@example.com',
      },
    ],
  })
  fieldValues: CrmObjectListFieldValueDto[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: string;
}
