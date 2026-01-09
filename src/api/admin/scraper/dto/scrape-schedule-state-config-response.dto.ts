import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ScrapeJobRunType } from '../../../enums/scrape/scrape-job-run-type.enum';
import { ScrapeScheduleStateConfigStateCountDto } from './scrape-schedule-state-config-state-count.dto';

export class ScrapeScheduleStateConfigResponseDto {
  @ApiProperty()
  runDate: string;

  @ApiProperty({ enum: ScrapeJobRunType, enumName: 'ScrapeRunType' })
  runType: ScrapeJobRunType;

  @ApiProperty({ type: [ScrapeScheduleStateConfigStateCountDto] })
  jobsByState: ScrapeScheduleStateConfigStateCountDto[];

  @ApiProperty()
  @Type(() => Number)
  totalJobs: number;
}
