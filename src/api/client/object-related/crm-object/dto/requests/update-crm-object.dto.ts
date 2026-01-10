import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCrmObjectDto {
  @ApiPropertyOptional({
    description: 'New display name for the object',
    example: 'John Smith',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Partial field values to update (merged with existing values)',
    example: {
      email: 'john.smith@example.com',
      deal_value: 75000,
    },
  })
  @IsObject()
  @IsOptional()
  fieldValues?: Record<string, any>;
}