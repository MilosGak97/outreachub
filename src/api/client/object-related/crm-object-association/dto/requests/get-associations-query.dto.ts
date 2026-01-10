import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetAssociationsQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by source object ID',
  })
  @IsUUID()
  @IsOptional()
  sourceObjectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by target object ID',
  })
  @IsUUID()
  @IsOptional()
  targetObjectId?: string;

  @ApiPropertyOptional({
    description: 'Filter by association type ID',
  })
  @IsUUID()
  @IsOptional()
  typeId?: string;

  @ApiProperty({
    required: true,
    description: 'Number of records to return',
    example: 20,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number;

  @ApiProperty({
    required: true,
    description: 'Number of records to skip',
    example: 0,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number;
}