import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ScrapeRunsQueryDto {
  @ApiPropertyOptional({ description: 'Run date (YYYY-MM-DD). Defaults to today when omitted.' })
  @IsOptional()
  @IsString()
  runDate?: string;

  @ApiPropertyOptional({ description: 'Limit (max 100)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset for pagination' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  offset?: number;
}
