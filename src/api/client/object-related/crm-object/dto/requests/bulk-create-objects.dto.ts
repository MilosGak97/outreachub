import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkObjectItemDto {
  @ApiProperty({
    description: 'Display name for the object',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName: string;

  @ApiPropertyOptional({
    description: 'Field values keyed by field apiName',
  })
  @IsObject()
  @IsOptional()
  fieldValues?: Record<string, any>;
}

export class BulkCreateObjectsDto {
  @ApiProperty({
    description: 'ID of the CrmObjectType for all objects',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  objectTypeId: string;

  @ApiProperty({
    description: 'Array of objects to create (max 100)',
    type: [BulkObjectItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkObjectItemDto)
  @ArrayMaxSize(100, { message: 'Maximum 100 objects per bulk create' })
  objects: BulkObjectItemDto[];
}
