import { Repository, SelectQueryBuilder } from 'typeorm';
import { PropertyListing } from '../../../entities/property/property-listing.entity';
import { PropertyListingsSearchDto } from '../../../admin/properties/dto/property-listings-search.dto';
import { PropertyListingItemDto } from '../../../admin/properties/dto/property-listing-item.dto';
import { PropertyStatus } from '../../../enums/property/property-status.enum';
import { FilteredStatus } from '../../../enums/property/filtered-status.enum';
import { HomeType } from '../../../enums/property/home-type.enum';

type CountyFilter = {
  countyZillow: string;
  state?: string;
};

const COUNTY_SQL_EXPRESSION = `REGEXP_REPLACE(REPLACE(COALESCE(baseEnrichment.countyZillow, property.countyZillow), ' ', '_'), '_(County|Borough|Parish)$', '', 'i')`;

export function getUtcTodayRangeIso(): { from: string; to: string; toExclusive: string } {
  const now = new Date();
  const fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const toExclusiveDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  const toDate = new Date(toExclusiveDate.getTime() - 1);
  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    toExclusive: toExclusiveDate.toISOString(),
  };
}

export function applyListingCreatedAtFilter(qb: SelectQueryBuilder<PropertyListing>, dto: PropertyListingsSearchDto): void {
  if (!dto.createdFrom && !dto.createdTo) {
    const range = getUtcTodayRangeIso();
    qb.andWhere('pl.createdAt >= :defaultCreatedFrom', { defaultCreatedFrom: range.from });
    qb.andWhere('pl.createdAt < :defaultCreatedToExclusive', { defaultCreatedToExclusive: range.toExclusive });
    return;
  }

  if (dto.createdFrom) {
    qb.andWhere('pl.createdAt >= :createdFrom', { createdFrom: dto.createdFrom });
  }

  if (dto.createdTo) {
    qb.andWhere('pl.createdAt <= :createdTo', { createdTo: dto.createdTo });
  }
}

export function createListingSearchOptimizedBaseQuery(
  repository: Repository<PropertyListing>,
): SelectQueryBuilder<PropertyListing> {
  return repository
    .createQueryBuilder('pl')
    .innerJoin('pl.property', 'property')
    .leftJoin('property.aiFiltering', 'aiFiltering')
    .leftJoin('property.baseEnrichment', 'baseEnrichment');
}

export function createListingSearchOptimizedQuery(repository: Repository<PropertyListing>): SelectQueryBuilder<PropertyListing> {
  const qb = createListingSearchOptimizedBaseQuery(repository);
  qb.select('pl.id', 'listing_id')
    .addSelect('pl.status', 'listing_status')
    .addSelect('pl.statusDate', 'listing_status_date')
    .addSelect('pl.createdAt', 'listing_created_at')
    .addSelect('pl.updatedAt', 'listing_updated_at')
    .addSelect('property.id', 'property_id')
    .addSelect('property.zpid', 'property_zpid')
    .addSelect('property.url', 'property_url')
    .addSelect('aiFiltering.filteredStatus', 'ai_filtered_status')
    .addSelect('property.state', 'property_state')
    .addSelect('property.city', 'property_city')
    .addSelect('property.zipcode', 'property_zipcode')
    .addSelect('property.streetAddress', 'property_street_address')
    .addSelect('property.bedrooms', 'property_bedrooms')
    .addSelect('property.bathrooms', 'property_bathrooms')
    .addSelect('property.price', 'property_price')
    .addSelect('property.livingAreaValue', 'property_living_area_value')
    .addSelect('property.longitude', 'property_longitude')
    .addSelect('property.latitude', 'property_latitude')
    .addSelect('property.has3DModel', 'property_has_3d_model')
    .addSelect('property.homeType', 'property_home_type')
    .addSelect('baseEnrichment.photoCount', 'base_photo_count')
    .addSelect('baseEnrichment.mosaicS3Key', 'base_mosaic_s3_key')
    .addSelect('baseEnrichment.realtorName', 'base_realtor_name')
    .addSelect('baseEnrichment.realtorPhone', 'base_realtor_phone')
    .addSelect('baseEnrichment.brokerName', 'base_broker_name')
    .addSelect('COALESCE(baseEnrichment.countyZillow, property.countyZillow)', 'listing_county');
  return qb;
}

export function createListingExportOptimizedQuery(repository: Repository<PropertyListing>): SelectQueryBuilder<PropertyListing> {
  const qb = repository
    .createQueryBuilder('pl')
    .leftJoin('pl.property', 'property')
    .leftJoin('property.county', 'county')
    .leftJoin('property.aiFiltering', 'aiFiltering')
    .leftJoin('property.baseEnrichment', 'baseEnrichment')
    .leftJoin('property.homeownerEnrichment', 'homeownerEnrichment');

  qb.select('pl.id', 'listing_id')
    .addSelect('pl.status', 'listing_status')
    .addSelect('pl.statusDate', 'listing_statusDate')
    .addSelect('pl.createdAt', 'listing_createdAt')
    .addSelect('pl.updatedAt', 'listing_updatedAt')
    .addSelect('property.id', 'property_id')
    .addSelect('property.zpid', 'property_zpid')
    .addSelect('property.streetAddress', 'property_streetAddress')
    .addSelect('property.zipcode', 'property_zipcode')
    .addSelect('property.city', 'property_city')
    .addSelect('property.state', 'property_state')
    .addSelect('property.has3DModel', 'property_has3DModel')
    .addSelect('property.imgSrc', 'property_imgSrc')
    .addSelect('property.brokerName', 'property_brokerName')
    .addSelect('property.bedrooms', 'property_bedrooms')
    .addSelect('property.bathrooms', 'property_bathrooms')
    .addSelect('property.price', 'property_price')
    .addSelect('property.homeType', 'property_homeType')
    .addSelect('property.longitude', 'property_longitude')
    .addSelect('property.latitude', 'property_latitude')
    .addSelect('property.livingAreaValue', 'property_livingAreaValue')
    .addSelect('property.lotAreaUnit', 'property_lotAreaUnit')
    .addSelect('property.lotAreaValue', 'property_lotAreaValue')
    .addSelect('property.url', 'property_url')
    .addSelect('property.daysOnZillow', 'property_daysOnZillow')
    .addSelect('property.timeOnZillow', 'property_timeOnZillow')
    .addSelect('property.countyZillow', 'property_countyZillow')
    .addSelect('property.createdAt', 'property_createdAt')
    .addSelect('property.updatedAt', 'property_updatedAt')
    .addSelect('county.id', 'county_id')
    .addSelect('county.name', 'county_name')
    .addSelect('county.state', 'county_state')
    .addSelect('county.productId', 'county_productId')
    .addSelect('county.priceId', 'county_priceId')
    .addSelect('county.amount', 'county_amount')
    .addSelect('county.zipCodes', 'county_zipCodes')
    .addSelect('county.scrappingEndDate', 'county_scrappingEndDate')
    .addSelect('county.zillowLinks', 'county_zillowLinks')
    .addSelect('county.zillowLink', 'county_zillowLink')
    .addSelect('county.zillowDefineInput', 'county_zillowDefineInput')
    .addSelect('county.createdAt', 'county_createdAt')
    .addSelect('county.updatedAt', 'county_updatedAt')
    .addSelect('aiFiltering.id', 'aiFiltering_id')
    .addSelect('aiFiltering.jobStatus', 'aiFiltering_jobStatus')
    .addSelect('aiFiltering.filteredStatus', 'aiFiltering_filteredStatus')
    .addSelect('aiFiltering.rawResponse', 'aiFiltering_rawResponse')
    .addSelect('baseEnrichment.id', 'baseEnrichment_id')
    .addSelect('baseEnrichment.realtorName', 'baseEnrichment_realtorName')
    .addSelect('baseEnrichment.realtorPhone', 'baseEnrichment_realtorPhone')
    .addSelect('baseEnrichment.brokerName', 'baseEnrichment_brokerName')
    .addSelect('baseEnrichment.brokeragePhone', 'baseEnrichment_brokeragePhone')
    .addSelect('baseEnrichment.parcelId', 'baseEnrichment_parcelId')
    .addSelect('baseEnrichment.mosaicS3Key', 'baseEnrichment_mosaicS3Key')
    .addSelect('baseEnrichment.countyZillow', 'baseEnrichment_countyZillow')
    .addSelect('baseEnrichment.photoCount', 'baseEnrichment_photoCount')
    .addSelect('baseEnrichment.photos', 'baseEnrichment_photos')
    .addSelect('homeownerEnrichment.id', 'homeownerEnrichment_id')
    .addSelect('homeownerEnrichment.ownerFirstName', 'homeownerEnrichment_ownerFirstName')
    .addSelect('homeownerEnrichment.ownerLastName', 'homeownerEnrichment_ownerLastName')
    .addSelect('homeownerEnrichment.isCommercial', 'homeownerEnrichment_isCommercial')
    .addSelect('homeownerEnrichment.homeOwnerRawData', 'homeownerEnrichment_homeOwnerRawData')
    .addSelect('homeownerEnrichment.createdAt', 'homeownerEnrichment_createdAt');

  return qb;
}

export function escapeCsvCell(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (value instanceof Date) return value.toISOString();
  const primitive =
    typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : JSON.stringify(value);
  const normalizedValue = primitive ?? '';
  if (/[",\n\r]/.test(normalizedValue)) return `"${normalizedValue.replace(/"/g, '""')}"`;
  return normalizedValue;
}

export function normalizeCsvDate(value: unknown): unknown {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return value;
}

export function applyListingSearchFilters(qb: SelectQueryBuilder<PropertyListing>, dto: PropertyListingsSearchDto): void {
  if (dto.statuses?.length) {
    qb.andWhere('pl.status IN (:...statuses)', { statuses: dto.statuses });
  }

  applyListingCreatedAtFilter(qb, dto);

  const normalizedStates = dto.states?.map((state) => state.toUpperCase()) ?? [];
  if (normalizedStates.length > 0) {
    qb.andWhere('property.state IN (:...states)', { states: normalizedStates });
  }

  if (dto.filteredStatuses?.length) {
    qb.andWhere('aiFiltering.filteredStatus IN (:...filteredStatuses)', { filteredStatuses: dto.filteredStatuses });
  }

  if (dto.zpid) {
    qb.andWhere('property.zpid = :zpid', { zpid: dto.zpid });
  }

  if (dto.bedroomsMin !== undefined) {
    qb.andWhere('property.bedrooms >= :bedroomsMin', { bedroomsMin: dto.bedroomsMin });
  }

  if (dto.bedroomsMax !== undefined) {
    qb.andWhere('property.bedrooms <= :bedroomsMax', { bedroomsMax: dto.bedroomsMax });
  }

  if (dto.bathroomsMin !== undefined) {
    qb.andWhere('property.bathrooms >= :bathroomsMin', { bathroomsMin: dto.bathroomsMin });
  }

  if (dto.bathroomsMax !== undefined) {
    qb.andWhere('property.bathrooms <= :bathroomsMax', { bathroomsMax: dto.bathroomsMax });
  }

  if (dto.priceMin !== undefined) {
    qb.andWhere('property.price >= :priceMin', { priceMin: dto.priceMin });
  }

  if (dto.priceMax !== undefined) {
    qb.andWhere('property.price <= :priceMax', { priceMax: dto.priceMax });
  }

  if (dto.livingAreaMin !== undefined) {
    qb.andWhere('CAST(property.living_area_value AS numeric) >= :livingAreaMin', { livingAreaMin: dto.livingAreaMin });
  }

  if (dto.livingAreaMax !== undefined) {
    qb.andWhere('CAST(property.living_area_value AS numeric) <= :livingAreaMax', { livingAreaMax: dto.livingAreaMax });
  }

  if (dto.homeTypes?.length) {
    qb.andWhere('property.homeType IN (:...homeTypes)', { homeTypes: dto.homeTypes });
  }

  if (dto.has3DModel !== undefined) {
    qb.andWhere('property.has3DModel = :has3DModel', { has3DModel: dto.has3DModel });
  }

  if (dto.photoCountMin !== undefined) {
    qb.andWhere('baseEnrichment.photoCount >= :photoCountMin', { photoCountMin: dto.photoCountMin });
  }

  if (dto.photoCountMax !== undefined) {
    qb.andWhere('baseEnrichment.photoCount <= :photoCountMax', { photoCountMax: dto.photoCountMax });
  }

  const countyFilters = buildCountyFilters(dto.counties);
  if (countyFilters.length > 0) {
    const clauses: string[] = [];
    const params: Record<string, unknown> = {};
    countyFilters.forEach((filter, index) => {
      const countyParam = `countyZillow${index}`;
      const stateParam = `countyState${index}`;
      let clause = `(LOWER(${COUNTY_SQL_EXPRESSION}) = LOWER(:${countyParam})`;
      params[countyParam] = filter.countyZillow;
      if (filter.state) {
        clause += ` AND property.state = :${stateParam}`;
        params[stateParam] = filter.state;
      }
      clause += ')';
      clauses.push(clause);
    });
    qb.andWhere(`(${clauses.join(' OR ')})`, params);
  }
}

export function applyListingSearchSort(qb: SelectQueryBuilder<PropertyListing>): void {
  qb.orderBy('pl.statusDate', 'DESC');
  qb.addOrderBy('pl.id', 'ASC');
}

export function mapListingRawToItemDto(row: Record<string, any>): PropertyListingItemDto {
  const livingAreaValue = row.property_living_area_value;
  const livingAreaSqft =
    livingAreaValue === undefined || livingAreaValue === null || livingAreaValue === ''
      ? undefined
      : Number(livingAreaValue);
  const priceValue = row.property_price;
  const price = priceValue !== undefined && priceValue !== null ? Number(priceValue) : undefined;
  const bedroomsValue = row.property_bedrooms;
  const bathroomsValue = row.property_bathrooms;
  const photoCountValue = row.base_photo_count;
  const countyName = formatCountyDisplayName(row.listing_county);

  return {
    listingId: row.listing_id,
    propertyId: row.property_id,
    zpid: row.property_zpid,
    url: row.property_url,
    status: row.listing_status,
    statusDate: row.listing_status_date,
    filteredStatus: row.ai_filtered_status as FilteredStatus | undefined,
    state: row.property_state,
    city: row.property_city,
    zipcode: row.property_zipcode,
    streetAddress: row.property_street_address,
    bedrooms: bedroomsValue !== undefined && bedroomsValue !== null ? Number(bedroomsValue) : undefined,
    bathrooms: bathroomsValue !== undefined && bathroomsValue !== null ? Number(bathroomsValue) : undefined,
    price,
    livingAreaSqft,
    has3DModel: row.property_has_3d_model,
    longitude: row.property_longitude,
    latitude: row.property_latitude,
    homeType: row.property_home_type as HomeType | undefined,
    photoCount: photoCountValue !== undefined && photoCountValue !== null ? Number(photoCountValue) : undefined,
    realtorName: row.base_realtor_name,
    realtorPhone: row.base_realtor_phone,
    brokerName: row.base_broker_name,
    mosaicS3Key: row.base_mosaic_s3_key,
    county: countyName,
    createdAt: row.listing_created_at,
    updatedAt: row.listing_updated_at,
  };
}

export function normalizeStatuses(statuses: string[]): PropertyStatus[] {
  const normalizedStatuses: PropertyStatus[] = [];
  const seen = new Set<PropertyStatus>();
  for (const status of statuses) {
    const normalizedStatus = mapRawStatus(status.toString().toUpperCase());
    if (normalizedStatus && !seen.has(normalizedStatus)) {
      seen.add(normalizedStatus);
      normalizedStatuses.push(normalizedStatus);
    }
  }
  return normalizedStatuses;
}

export function mapRawStatus(raw: string): PropertyStatus | undefined {
  switch (raw) {
    case 'COMING_SOON':
      return PropertyStatus.COMING_SOON;
    case 'FOR_SALE':
    case 'ACTIVE':
      return PropertyStatus.FOR_SALE;
    case 'FOR_SALE_AGAIN':
      return PropertyStatus.FOR_SALE_AGAIN;
    case 'PENDING':
    case 'UNDER_CONTRACT':
    case 'UNDER CONTRACT':
      return PropertyStatus.PENDING;
    case 'SOLD':
      return PropertyStatus.SOLD;
    case 'OFF_MARKET':
    case 'OFF MARKET':
      return PropertyStatus.OFF_MARKET;
    default:
      return undefined;
  }
}

export function buildCountyFilters(values?: string[]): CountyFilter[] {
  if (!values?.length) return [];
  const seen = new Set<string>();
  const filters: CountyFilter[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const lastComma = trimmed.lastIndexOf(',');
    const rawName = lastComma >= 0 ? trimmed.slice(0, lastComma).trim() : trimmed;
    const rawState = lastComma >= 0 ? trimmed.slice(lastComma + 1).trim() : undefined;
    if (!rawName) continue;

    const cleanedName = rawName.replace(/\s+(County|Borough|Parish)$/i, '').trim() || rawName;
    const normalizedCounty = cleanedName
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!normalizedCounty) continue;

    const state = rawState ? rawState.toUpperCase() : undefined;
    const key = `${normalizedCounty}|${state || ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    filters.push({ countyZillow: normalizedCounty, state });
  }
  return filters;
}

export function formatCountyDisplayName(raw?: string): string | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/_/g, ' ').trim();
  if (!cleaned) return undefined;

  const words = cleaned.split(/\s+/).map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  const formatted = words.join(' ');
  if (!formatted) return undefined;

  if (/(County|Borough|Parish)$/i.test(formatted)) {
    return formatted;
  }

  return `${formatted} County`;
}
