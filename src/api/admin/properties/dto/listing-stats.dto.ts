import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { PropertyStatus } from '../../../enums/property/property-status.enum';

const toStringArray = <T extends string>(value: unknown, mapFn?: (val: string) => string): T[] | undefined => {
  if (value === undefined || value === null) return undefined;
  const rawValues = Array.isArray(value) ? value : value.toString().split(',');
  const normalized = rawValues
    .map((v) => (v ?? '').toString().trim())
    .filter(Boolean)
    .map((v) => (mapFn ? mapFn(v) : v));
  return normalized.length > 0 ? (normalized as T[]) : undefined;
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

export class ListingStatsDto {
  @ApiPropertyOptional({ description: 'Start date (inclusive) for createdAt filter', type: String, example: '2025-01-01T00:00:00Z' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => normalizeDateBoundary(value, 'from'), { toClassOnly: true })
  from?: string;

  @ApiPropertyOptional({ description: 'End date (inclusive) for createdAt filter', type: String, example: '2025-01-31T23:59:59Z' })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => normalizeDateBoundary(value, 'to'), { toClassOnly: true })
  to?: string;

  @ApiPropertyOptional({ description: 'Filter by property states (US codes)', type: [String] })
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => toStringArray<string>(value, (v) => v.toUpperCase()), { toClassOnly: true })
  states?: string[];

  @ApiPropertyOptional({
    description: 'Filter by listing statuses',
    enum: PropertyStatus,
    enumName: 'PropertyStatus',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PropertyStatus, { each: true })
  @Transform(({ value }) => toStringArray<PropertyStatus>(value, (v) => v.toUpperCase()), { toClassOnly: true })
  statuses?: PropertyStatus[];
}
