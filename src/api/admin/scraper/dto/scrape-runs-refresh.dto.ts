import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ScrapeRunsRefreshDto {
  @ApiPropertyOptional({ description: 'Run date (YYYY-MM-DD). Defaults to today when omitted.' })
  @IsOptional()
  @IsString()
  runDate?: string;
}
