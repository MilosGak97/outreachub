import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { PropertyListingItemDto } from './property-listing-item.dto';

@ApiExtraModels(PropertyListingItemDto)
export class PropertyListingsSearchResponseDto {
  @ApiProperty({ type: [PropertyListingItemDto] })
  result: PropertyListingItemDto[];

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  totalRecords: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  currentPage: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  totalPages: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  offset: number;
}
