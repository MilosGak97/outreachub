import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ScrapeRunStateSummaryDto } from './scrape-run-state-summary.dto';

@ApiExtraModels(ScrapeRunStateSummaryDto)
export class ScrapeRunsResponseDto {
  @ApiProperty({ type: [ScrapeRunStateSummaryDto] })
  result: ScrapeRunStateSummaryDto[];

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
