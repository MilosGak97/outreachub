import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ListingStateBreakdownItemDto } from './listing-state-breakdown-item.dto';

export class ListingStateBreakdownResponseDto {
  @ApiProperty({ type: [ListingStateBreakdownItemDto] })
  records: ListingStateBreakdownItemDto[];

  @ApiProperty()
  @Type(() => Number)
  totalRecords: number;

  @ApiProperty()
  @Type(() => Number)
  totalPages: number;

  @ApiProperty()
  @Type(() => Number)
  currentPage: number;

  @ApiProperty()
  @Type(() => Number)
  limit: number;

  @ApiProperty()
  @Type(() => Number)
  offset: number;
}
