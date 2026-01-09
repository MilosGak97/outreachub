import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ListingStateBreakdownItemDto {
  @ApiProperty()
  state: string;

  @ApiProperty()
  @Type(() => Number)
  forSale: number;

  @ApiProperty()
  @Type(() => Number)
  pending: number;

  @ApiProperty()
  @Type(() => Number)
  comingSoon: number;
}
