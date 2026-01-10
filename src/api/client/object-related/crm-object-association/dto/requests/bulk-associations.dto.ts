import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class BulkAssociationItemDto {
  @ApiProperty({
    description: 'Association type ID',
  })
  @IsUUID()
  @IsNotEmpty()
  typeId: string;

  @ApiProperty({
    description: 'Target object ID',
  })
  @IsUUID()
  @IsNotEmpty()
  targetObjectId: string;

  @ApiPropertyOptional({
    description: 'Optional metadata',
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class BulkCreateAssociationsDto {
  @ApiProperty({
    description: 'Source object ID (shared by all associations)',
  })
  @IsUUID()
  @IsNotEmpty()
  sourceObjectId: string;

  @ApiProperty({
    description: 'Array of associations to create (max 50)',
    type: [BulkAssociationItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAssociationItemDto)
  @ArrayMaxSize(50, { message: 'Maximum 50 associations per bulk create' })
  associations: BulkAssociationItemDto[];
}

export class BulkDeleteAssociationsDto {
  @ApiProperty({
    description: 'Array of association IDs to delete (max 50)',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(50, { message: 'Maximum 50 associations per bulk delete' })
  associationIds: string[];
}