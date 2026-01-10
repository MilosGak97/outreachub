import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrmObjectResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Object type ID',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  objectTypeId: string;

  @ApiProperty({
    description: 'Object type API name',
    example: 'contact',
  })
  objectTypeApiName: string;

  @ApiProperty({
    description: 'Object type display name',
    example: 'Contact',
  })
  objectTypeName: string;

  @ApiProperty({
    description: 'Display name of the object',
    example: 'John Doe',
  })
  displayName: string;

  @ApiProperty({
    description: 'Field values keyed by apiName',
    example: {
      email: 'john@example.com',
      phone: { code: '+1', number: '5551234567' },
      deal_value: 50000,
    },
  })
  fieldValues: Record<string, any>;

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
