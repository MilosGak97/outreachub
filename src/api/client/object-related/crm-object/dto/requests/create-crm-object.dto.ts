import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateCrmObjectDto {
  @ApiProperty({
    description: 'ID of the CrmObjectType this object belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  objectTypeId: string;

  @ApiProperty({
    description: 'Display name for the object (e.g., "John Doe" for a contact)',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName: string;

  @ApiPropertyOptional({
    description: 'Field values keyed by field apiName',
    example: {
      email: 'john@example.com',
      phone: { code: '+1', number: '5551234567' },
      deal_value: 50000,
    },
  })
  @IsObject()
  @IsOptional()
  fieldValues?: Record<string, any>;
}
