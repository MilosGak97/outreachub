import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDateString, IsOptional } from 'class-validator';

export class ScrapeRunsTotalsQueryDto {
  @ApiPropertyOptional({ description: 'Run date from (YYYY-MM-DD). Defaults to today when omitted.' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => normalizeDateBoundary(value, 'from'), { toClassOnly: true })
  runDateFrom?: string;

  @ApiPropertyOptional({ description: 'Run date to (YYYY-MM-DD). Defaults to today when omitted.' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => normalizeDateBoundary(value, 'to'), { toClassOnly: true })
  runDateTo?: string;
}

const normalizeDateBoundary = (value: unknown, boundary: 'from' | 'to'): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = value.toString().trim();
  if (!raw) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return boundary === 'from' ? `${raw}T00:01:00.000Z` : `${raw}T23:59:59.999Z`;
  }
  return raw;
};
