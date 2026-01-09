import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ScrapeJobItemDto } from './scrape-job-item.dto';

@ApiExtraModels(ScrapeJobItemDto)
export class ScrapeJobsListResponseDto {
  @ApiProperty({ type: [ScrapeJobItemDto] })
  result: ScrapeJobItemDto[];

  @ApiProperty()
  @Type(() => Number)
  totalRecords: number;

  @ApiProperty()
  @Type(() => Number)
  currentPage: number;

  @ApiProperty()
  @Type(() => Number)
  totalPages: number;

  @ApiProperty()
  @Type(() => Number)
  limit: number;

  @ApiProperty()
  @Type(() => Number)
  offset: number;
}
