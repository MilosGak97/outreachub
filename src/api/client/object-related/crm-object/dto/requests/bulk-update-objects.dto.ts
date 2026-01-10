import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkUpdateItemDto {
  @ApiProperty({
    description: 'ID of the object to update',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id: string;

  @ApiPropertyOptional({
    description: 'New display name',
    example: 'John Smith',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Partial field values to update',
  })
  @IsObject()
  @IsOptional()
  fieldValues?: Record<string, any>;
}

export class BulkUpdateObjectsDto {
  @ApiProperty({
    description: 'Array of objects to update (max 100)',
    type: [BulkUpdateItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateItemDto)
  @ArrayMaxSize(100, { message: 'Maximum 100 objects per bulk update' })
  objects: BulkUpdateItemDto[];
}