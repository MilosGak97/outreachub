import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';

export class GetAllAssociationTypesQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @ApiPropertyOptional({
    description:
      'Filter by object type id (source matches always; target matches only if bidirectional).',
  })
  @IsOptional()
  @IsUUID('4')
  @IsString()
  objectTypeId?: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  offset: number;
}
