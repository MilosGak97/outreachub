import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCrmObjectTypeDto {
  @ApiPropertyOptional({ example: 'Contacts', description: 'New name for the object type' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'This object holds contact information', description: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;
}