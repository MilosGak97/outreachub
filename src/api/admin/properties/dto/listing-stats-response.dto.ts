import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ListingStatsResponseDto {
  @ApiProperty({ description: 'Total listings matching filters' })
  @Type(() => Number)
  totalListings: number;

  @ApiProperty({ description: 'Counts by status' })
  countsByStatus: Record<string, number>;

  @ApiProperty({ description: 'Counts by state' })
  countsByState: Record<string, number>;
}
