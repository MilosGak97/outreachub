import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ScrapeJobStatus } from '../../../enums/scrape/scrape-job-status.enum';
import { StatesAbbreviation } from '../../../enums/common/states-abbreviation.enum';

export class ScrapeJobItemDto {
  @ApiProperty()
  jobId: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty({ enum: StatesAbbreviation, enumName: 'StatesAbbreviation' })
  state: StatesAbbreviation;

  @ApiProperty()
  @Type(() => Number)
  segmentIndex: number;

  @ApiProperty()
  @Type(() => Number)
  segmentCount: number;

  @ApiProperty({ enum: ScrapeJobStatus, enumName: 'ScrapeJobStatus' })
  status: ScrapeJobStatus;

  @ApiProperty()
  stateSegmentRunKey: string;

  @ApiProperty()
  @Type(() => Number)
  failedCount: number;

  @ApiProperty()
  @Type(() => Number)
  resultCount: number;

  @ApiProperty()
  @Type(() => Number)
  newCount: number;

  @ApiProperty()
  @Type(() => Number)
  changedCount: number;

  @ApiProperty()
  @Type(() => Number)
  unchangedCount: number;

  @ApiProperty()
  zillowLink: string;
}
