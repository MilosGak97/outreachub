import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { PropertyStatus } from '../../../enums/property/property-status.enum';
import { FilteredStatus } from '../../../enums/property/filtered-status.enum';
import { HomeType } from '../../../enums/property/home-type.enum';
import { StatesAbbreviation } from '../../../enums/common/states-abbreviation.enum';

const toStringArray = <T extends string>(value: unknown, mapFn?: (val: string) => string): T[] | undefined => {
  if (value === undefined || value === null) return undefined;
  const rawValues = Array.isArray(value) ? value : value.toString().split(',');
  const normalized = rawValues
    .map((v) => (v ?? '').toString().trim())
    .filter(Boolean)
    .map((v) => (mapFn ? mapFn(v) : v));
  return normalized.length > 0 ? (normalized as T[]) : undefined;
};

const toStringList = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  const rawValues = Array.isArray(value) ? value : [value];
  const normalized = rawValues
    .map((v) => (v ?? '').toString().trim())
    .filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
};

const toOptionalBoolean = (value: unknown): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  const normalized = value.toString().trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
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

export class PropertyListingsSearchDto {
  @ApiPropertyOptional({ enum: PropertyStatus, isArray: true ,
    enumName: 'PropertyStatus',})
  @IsOptional()
  @IsArray()
  @IsEnum(PropertyStatus, { each: true })
  @Transform(({ value }) => toStringArray<PropertyStatus>(value, (v) => v.toUpperCase()), { toClassOnly: true })
  statuses?: PropertyStatus[];

  @ApiPropertyOptional({ description: 'Listing createdAt from (inclusive)', type: String })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => normalizeDateBoundary(value, 'from'), { toClassOnly: true })
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Listing createdAt to (inclusive)', type: String })
  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => normalizeDateBoundary(value, 'to'), { toClassOnly: true })
  createdTo?: string;


  @ApiPropertyOptional({
    description: 'Optional filter by state (e.g. IL)',
    enum: StatesAbbreviation,
    enumName: 'StatesAbbreviation',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => toStringArray<string>(value, (v) => v.toUpperCase()), { toClassOnly: true })
  states?: string[];

  @ApiPropertyOptional({
    description: 'Filter listings by county from `/common/counties`. Accepts one or more values (e.g. `["Cook County, IL"]`).',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => toStringList(value), { toClassOnly: true })
  counties?: string[];

  @ApiPropertyOptional({ description: 'Filter by AI filtering outcome', enum: FilteredStatus, isArray: true,  enumName: 'FilteredStatus' })
  @IsOptional()
  @IsArray()
  @IsEnum(FilteredStatus, { each: true })
  @Transform(({ value }) => toStringArray<FilteredStatus>(value), { toClassOnly: true })
  filteredStatuses?: FilteredStatus[];

  @ApiPropertyOptional({ description: 'Bedrooms min' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bedroomsMin?: number;

  @ApiPropertyOptional({ description: 'Bedrooms max' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bedroomsMax?: number;

  @ApiPropertyOptional({ description: 'Bathrooms min' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bathroomsMin?: number;

  @ApiPropertyOptional({ description: 'Bathrooms max' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bathroomsMax?: number;

  @ApiPropertyOptional({ description: 'Price min' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMin?: number;

  @ApiPropertyOptional({ description: 'Price max' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceMax?: number;

  @ApiPropertyOptional({ description: 'Living area (sqft) min' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  livingAreaMin?: number;

  @ApiPropertyOptional({ description: 'Living area (sqft) max' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  livingAreaMax?: number;

  @ApiPropertyOptional({
    description: 'Filter by home types',
    enum: HomeType,
    enumName: 'HomeType',
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => toStringArray<HomeType>(value), { toClassOnly: true })
  homeTypes?: HomeType[];

  @ApiPropertyOptional({ description: 'Require 3D model' })
  @IsOptional()
  @Transform(({ value }) => toOptionalBoolean(value), { toClassOnly: true })
  @IsBoolean()
  has3DModel?: boolean;

  @ApiPropertyOptional({ description: 'Photo count min' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  photoCountMin?: number;

  @ApiPropertyOptional({ description: 'Photo count max' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  photoCountMax?: number;

  @ApiPropertyOptional({ description: 'Filter by a specific zpid' })
  @IsOptional()
  @IsString()
  zpid?: string;

  @ApiPropertyOptional({ description: 'Limit', default: 50, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Offset', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
