import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StatesAbbreviation } from '../../../enums/common/states-abbreviation.enum';

export class ScrapeScheduleStateConfigStateCountDto {
  @ApiProperty({ enum: StatesAbbreviation, enumName: 'StatesAbbreviation' })
  state: StatesAbbreviation;

  @ApiProperty()
  @Type(() => Number)
  jobs: number;
}
