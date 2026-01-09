import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { ScrapeJobStatus } from '../../../enums/scrape/scrape-job-status.enum';
import { StatesAbbreviation } from '../../../enums/common/states-abbreviation.enum';

const toArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  const rawValues = Array.isArray(value) ? value : [value];
  const flattened: string[] = [];
  for (const raw of rawValues) {
    if (raw === undefined || raw === null) continue;
    if (Array.isArray(raw)) {
      flattened.push(...raw.map((v) => v.toString()));
      continue;
    }
    const asString = raw.toString();
    if (asString.includes(',')) {
      flattened.push(...asString.split(',').map((part) => part.trim()).filter(Boolean));
    } else if (asString.trim()) {
      flattened.push(asString.trim());
    }
  }
  return flattened.length > 0 ? flattened : undefined;
};

const toArrayFromQuery = (
  value: unknown,
  obj: Record<string, unknown> | undefined,
  fallbackKey: string,
): string[] | undefined => {
  if (value !== undefined) return toArray(value);
  if (!obj) return undefined;
  if (Object.prototype.hasOwnProperty.call(obj, fallbackKey)) {
    return toArray(obj[fallbackKey]);
  }
  return undefined;
};

const normalizeDateBoundary = (value: unknown, boundary: 'from' | 'to'): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = value.toString().trim();
  if (!raw) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return boundary === 'from' ? `${raw}T00:01:00.000Z` : `${raw}T23:59:59.999Z`;
  }
  return raw;
};

const normalizeSearchQuery = (value: unknown): string | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const raw = value.toString().trim();
  return raw ? raw.toUpperCase() : undefined;
};

export class ScrapeJobsListQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by statuses',
    enum: ScrapeJobStatus,
    enumName: 'ScrapeJobStatus',
    isArray: true,
  })
  @Transform(
    ({ value, obj }) => toArrayFromQuery(value, obj, 'statuses[]')?.map((v) => v.toUpperCase()),
    { toClassOnly: true },
  )
  @IsOptional()
  @IsArray()
  @IsEnum(ScrapeJobStatus, { each: true })
  statuses?: ScrapeJobStatus[];

  @ApiPropertyOptional({ description: 'createdAt from (inclusive)', type: String })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => normalizeDateBoundary(value, 'from'), { toClassOnly: true })
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'createdAt to (inclusive)', type: String })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => normalizeDateBoundary(value, 'to'), { toClassOnly: true })
  createdTo?: string;

  @ApiPropertyOptional({ description: 'Search by stateSegmentRunKey' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => normalizeSearchQuery(value), { toClassOnly: true })
  searchQuery?: string;

  @ApiPropertyOptional({
    description: 'Filter by states (abbreviation)',
    enum: StatesAbbreviation,
    enumName: 'StatesAbbreviation',
    isArray: true,
  })
  @Transform(({ value, obj }) => toArrayFromQuery(value, obj, 'states[]')?.map((v) => v.toUpperCase()), {
    toClassOnly: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(StatesAbbreviation, { each: true })
  states?: StatesAbbreviation[];

  @ApiPropertyOptional({ description: 'Filter by resultCount min' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  resultCountMin?: number;

  @ApiPropertyOptional({ description: 'Filter by resultCount max' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  resultCountMax?: number;

  @ApiPropertyOptional({ description: 'Limit', default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Offset', default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  offset?: number = 0;
}
