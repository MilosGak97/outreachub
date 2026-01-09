import { Injectable, StreamableFile } from '@nestjs/common';
import { Readable } from 'stream';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { PropertyListing } from '../../../entities/property/property-listing.entity';
import { PropertyListingsSearchDto } from '../../../admin/properties/dto/property-listings-search.dto';
import { PropertyListingsSearchResponseDto } from '../../../admin/properties/dto/property-listings-response.dto';
import { PropertyListingItemDto } from '../../../admin/properties/dto/property-listing-item.dto';
import { PropertyListingsExportDto } from '../../../admin/properties/dto/property-listings-export.dto';
import { ListingStatsDto } from '../../../admin/properties/dto/listing-stats.dto';
import { ListingStatsResponseDto } from '../../../admin/properties/dto/listing-stats-response.dto';
import { ListingStateBreakdownDto } from '../../../admin/properties/dto/listing-state-breakdown.dto';
import { ListingStateBreakdownResponseDto } from '../../../admin/properties/dto/listing-state-breakdown-response.dto';
import { PropertyStatus } from '../../../enums/property/property-status.enum';
import { FilteredStatus } from '../../../enums/property/filtered-status.enum';
import { HomeType } from '../../../enums/property/home-type.enum';

@Injectable()
export class PropertyListingRepository extends Repository<PropertyListing> {
  constructor(private readonly dataSource: DataSource) {
    super(PropertyListing, dataSource.createEntityManager());
  }

  async searchListingsOptimized(dto: PropertyListingsSearchDto): Promise<PropertyListingsSearchResponseDto> {
    const limit = Math.min(dto.limit ?? 50, 500);
    const offset = dto.offset ?? 0;

    const countQb = this.createListingSearchOptimizedBaseQuery();
    this.applyListingSearchFilters(countQb, dto);
    const total = await countQb.getCount();

    const qb = this.createListingSearchOptimizedQuery();
    this.applyListingSearchFilters(qb, dto);
    qb.offset(offset).limit(limit);

    const rows = await qb.getRawMany<Record<string, any>>();
    const records: PropertyListingItemDto[] = rows.map((row) => this.mapListingRawToItemDto(row));

    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = total > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;

    return {
      result: records,
      totalRecords: total,
      currentPage,
      totalPages,
      limit,
      offset,
    };
  }

  async exportListingsCsvOptimized(dto: PropertyListingsExportDto): Promise<StreamableFile> {
    const batchSize = 1000;
    const maxRows = 999999;

    const headers = [
      'listing_id',
      'listing_status',
      'listing_statusDate',
      'listing_createdAt',
      'listing_updatedAt',

      'property_id',
      'property_zpid',
      'property_streetAddress',
      'property_zipcode',
      'property_city',
      'property_state',
      'property_has3DModel',
      'property_imgSrc',
      'property_brokerName',
      'property_bedrooms',
      'property_bathrooms',
      'property_price',
      'property_homeType',
      'property_longitude',
      'property_latitude',
      'property_livingAreaValue',
      'property_lotAreaUnit',
      'property_lotAreaValue',
      'property_url',
      'property_daysOnZillow',
      'property_timeOnZillow',
      'property_countyZillow',
      'property_createdAt',
      'property_updatedAt',

      'county_id',
      'county_name',
      'county_state',
      'county_productId',
      'county_priceId',
      'county_amount',
      'county_zipCodes',
      'county_scrappingEndDate',
      'county_zillowLinks',
      'county_zillowLink',
      'county_zillowDefineInput',
      'county_createdAt',
      'county_updatedAt',

      'aiFiltering_id',
      'aiFiltering_jobStatus',
      'aiFiltering_filteredStatus',
      'aiFiltering_rawResponse',

      'baseEnrichment_id',
      'baseEnrichment_realtorName',
      'baseEnrichment_realtorPhone',
      'baseEnrichment_brokerName',
      'baseEnrichment_brokeragePhone',
      'baseEnrichment_parcelId',
      'baseEnrichment_mosaicS3Key',
      'baseEnrichment_countyZillow',
      'baseEnrichment_photoCount',
      'baseEnrichment_photos',

      'homeownerEnrichment_id',
      'homeownerEnrichment_ownerFirstName',
      'homeownerEnrichment_ownerLastName',
      'homeownerEnrichment_isCommercial',
      'homeownerEnrichment_homeOwnerRawData',
      'homeownerEnrichment_createdAt',
    ];

    const dateHeaders = new Set([
      'listing_statusDate',
      'listing_createdAt',
      'listing_updatedAt',
      'property_createdAt',
      'property_updatedAt',
      'county_scrappingEndDate',
      'county_createdAt',
      'county_updatedAt',
      'homeownerEnrichment_createdAt',
    ]);

    const qb = this.createListingExportOptimizedQuery();

    this.applyListingSearchFilters(qb, dto);
    this.applyListingSearchSort(qb);

    const filename = `property-listings-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;

    const csvStream = Readable.from(
      (async function* (repo: PropertyListingRepository) {
        yield `${headers.join(',')}\n`;

        let processed = 0;
        while (processed < maxRows) {
          const take = Math.min(batchSize, maxRows - processed);
          qb.offset(processed).limit(take);
          const rows = await qb.getRawMany<Record<string, any>>();
          if (rows.length === 0) break;

          for (const row of rows) {
            const values = headers.map((header) => {
              const rawValue = row[header];
              if (rawValue === null || rawValue === undefined) {
                return rawValue;
              }
              if (dateHeaders.has(header)) {
                return repo.normalizeCsvDate(rawValue);
              }
              return rawValue;
            });
            yield `${values.map((v) => repo.escapeCsvCell(v)).join(',')}\n`;
          }

          processed += rows.length;
          if (rows.length < take) break;
        }
      })(this),
    );

    return new StreamableFile(csvStream, {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="${filename}"`,
    });
  }

  async getListingStats(dto: ListingStatsDto): Promise<ListingStatsResponseDto> {
    const qb = this.createQueryBuilder('pl')
      .leftJoin('pl.property', 'property')
      .select('pl.status', 'status')
      .addSelect('property.state', 'state')
      .addSelect('COUNT(*)', 'count');

    let from = dto.from;
    let to = dto.to;
    if (!from && !to) {
      const range = this.getUtcTodayRangeIso();
      from = range.from;
      to = range.to;
    }
    if (from) {
      qb.andWhere('pl.createdAt >= :from', { from });
    }
    if (to) {
      qb.andWhere('pl.createdAt <= :to', { to });
    }
    if (dto.states && dto.states.length > 0) {
      qb.andWhere('property.state IN (:...states)', { states: dto.states.map((s) => s.toUpperCase()) });
    }
    if (dto.statuses && dto.statuses.length > 0) {
      const normalizedStatuses = this.normalizeStatuses(dto.statuses);
      if (normalizedStatuses.length > 0) {
        qb.andWhere('pl.status IN (:...statuses)', { statuses: normalizedStatuses });
      }
    }

    qb.groupBy('pl.status');
    qb.addGroupBy('property.state');

    const rows = await qb.getRawMany<{ status: PropertyStatus; state: string; count: string }>();
    const countsByStatus: Record<string, number> = {};
    const countsByState: Record<string, number> = {};
    const countsByStateAndStatus: Record<string, Record<string, number>> = {};
    let totalListings = 0;
    rows.forEach((r) => {
      const c = Number(r.count) || 0;
      countsByStatus[r.status] = (countsByStatus[r.status] || 0) + c;
      if (r.state) {
        countsByState[r.state] = (countsByState[r.state] || 0) + c;
        countsByStateAndStatus[r.state] = countsByStateAndStatus[r.state] || {};
        countsByStateAndStatus[r.state][r.status] = (countsByStateAndStatus[r.state][r.status] || 0) + c;
      }
      totalListings += c;
    });

    return {
      totalListings,
      countsByStatus,
      countsByState,
    };
  }

  async getListingStateBreakdown(dto: ListingStateBreakdownDto): Promise<ListingStateBreakdownResponseDto> {
    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;
    const qb = this.createQueryBuilder('pl')
      .leftJoin('pl.property', 'property')
      .select('property.state', 'state')
      .addSelect(`COUNT(*) FILTER (WHERE pl.status = :fs)`, 'forSale')
      .addSelect(`COUNT(*) FILTER (WHERE pl.status = :pending)`, 'pending')
      .addSelect(`COUNT(*) FILTER (WHERE pl.status = :comingSoon)`, 'comingSoon')
      .setParameters({
        fs: PropertyStatus.FOR_SALE,
        pending: PropertyStatus.PENDING,
        comingSoon: PropertyStatus.COMING_SOON,
      });

    let from = dto.from;
    let to = dto.to;
    if (!from && !to) {
      const range = this.getUtcTodayRangeIso();
      from = range.from;
      to = range.to;
    }
    if (from) {
      qb.andWhere('pl.createdAt >= :from', { from });
    }
    if (to) {
      qb.andWhere('pl.createdAt <= :to', { to });
    }
    if (dto.states && dto.states.length > 0) {
      qb.andWhere('property.state IN (:...states)', { states: dto.states.map((s) => s.toUpperCase()) });
    }
    if (dto.statuses && dto.statuses.length > 0) {
      const normalizedStatuses = this.normalizeStatuses(dto.statuses);
      if (normalizedStatuses.length > 0) {
        qb.andWhere('pl.status IN (:...statuses)', { statuses: normalizedStatuses });
      }
    }

    qb.groupBy('property.state');
    qb.orderBy('property.state', 'ASC');
    qb.offset(offset).limit(limit);

    const rows = await qb.getRawMany<{ state: string; forSale: string; pending: string; comingSoon: string }>();

    const normalizedStates = dto.states?.map((s) => s.toUpperCase()) ?? [];
    const existingStates = new Set(rows.map((r) => r.state));

    if (normalizedStates.length > 0) {
      normalizedStates.forEach((st) => {
        if (!existingStates.has(st)) {
          rows.push({ state: st, forSale: '0', pending: '0', comingSoon: '0' });
        }
      });
    }

    const totalRecords = rows.length;
    const totalPages = Math.ceil(totalRecords / limit) || 1;
    const currentPage = Math.floor(offset / limit) + 1;

    const records = rows.map((r) => ({
      state: r.state,
      forSale: Number(r.forSale) || 0,
      pending: Number(r.pending) || 0,
      comingSoon: Number(r.comingSoon) || 0,
    }));

    return {
      records,
      totalRecords,
      totalPages,
      currentPage,
      limit,
      offset,
    };
  }

  private createListingSearchOptimizedBaseQuery(): SelectQueryBuilder<PropertyListing> {
    return this.createQueryBuilder('pl')
      .innerJoin('pl.property', 'property')
      .leftJoin('property.aiFiltering', 'aiFiltering')
      .leftJoin('property.baseEnrichment', 'baseEnrichment');
  }

  private createListingSearchOptimizedQuery(): SelectQueryBuilder<PropertyListing> {
    const qb = this.createListingSearchOptimizedBaseQuery();
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
      .addSelect('baseEnrichment.countyZillow', 'base_county_zillow');
    return qb;
  }

  private createListingExportOptimizedQuery(): SelectQueryBuilder<PropertyListing> {
    const qb = this.createQueryBuilder('pl')
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

  private getUtcTodayRangeIso(): { from: string; to: string } {
    const now = new Date();
    const fromDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
    const toDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
    return { from: fromDate.toISOString(), to: toDate.toISOString() };
  }

  private escapeCsvCell(value: unknown): string {
    if (value === undefined || value === null) return '';
    if (value instanceof Date) return value.toISOString();
    const primitive =
      typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : JSON.stringify(value);
    const s = primitive ?? '';
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  private normalizeCsvDate(value: unknown): unknown {
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

  private applyListingSearchFilters(qb: SelectQueryBuilder<PropertyListing>, dto: PropertyListingsSearchDto): void {
    if (dto.statuses?.length) {
      qb.andWhere('pl.status IN (:...statuses)', { statuses: dto.statuses });
    }

    let createdFrom = dto.createdFrom;
    let createdTo = dto.createdTo;
    if (!createdFrom && !createdTo) {
      const range = this.getUtcTodayRangeIso();
      createdFrom = range.from;
      createdTo = range.to;
    }
    if (createdFrom) {
      qb.andWhere('pl.createdAt >= :createdFrom', { createdFrom });
    }
    if (createdTo) {
      qb.andWhere('pl.createdAt <= :createdTo', { createdTo });
    }

    const normalizedStates = dto.states?.map((s) => s.toUpperCase()) ?? [];
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

    const countyFilters = this.buildCountyFilters(dto.counties);
    if (countyFilters.length > 0) {
      const clauses: string[] = [];
      const params: Record<string, unknown> = {};
      countyFilters.forEach((filter, index) => {
        const countyParam = `countyZillow${index}`;
        const stateParam = `countyState${index}`;
        let clause = `(LOWER(baseEnrichment.countyZillow) = LOWER(:${countyParam})`;
        params[countyParam] = filter.countyZillow;
        if (filter.state) {
          clause += ` AND property.state = :${stateParam}`;
          params[stateParam] = filter.state;
        }
        clause += ')';
        clauses.push(clause);
      });
      qb.andWhere(clauses.join(' OR '), params);
    }
  }

  private applyListingSearchSort(qb: SelectQueryBuilder<PropertyListing>): void {
    qb.orderBy('pl.statusDate', 'DESC');
    qb.addOrderBy('pl.id', 'ASC');
  }

  private mapListingRawToItemDto(row: Record<string, any>): PropertyListingItemDto {
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
    const countyName = this.formatCountyDisplayName(row.base_county_zillow);

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

  private normalizeStatuses(statuses: string[]): PropertyStatus[] {
    const out: PropertyStatus[] = [];
    const seen = new Set<PropertyStatus>();
    for (const s of statuses) {
      const normalized = this.mapRawStatus(s.toString().toUpperCase());
      if (normalized && !seen.has(normalized)) {
        seen.add(normalized);
        out.push(normalized);
      }
    }
    return out;
  }

  private mapRawStatus(raw: string): PropertyStatus | undefined {
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

  private buildCountyFilters(values?: string[]): { countyZillow: string; state?: string }[] {
    if (!values?.length) return [];
    const seen = new Set<string>();
    const filters: { countyZillow: string; state?: string }[] = [];
    for (const value of values) {
      const trimmed = value?.trim();
      if (!trimmed) continue;
      const lastComma = trimmed.lastIndexOf(',');
      const rawName =
        lastComma >= 0 ? trimmed.slice(0, lastComma).trim() : trimmed;
      const rawState =
        lastComma >= 0 ? trimmed.slice(lastComma + 1).trim() : undefined;
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

  private formatCountyDisplayName(raw?: string): string | undefined {
    if (!raw) return undefined;
    const cleaned = raw.replace(/_/g, ' ').trim();
    if (!cleaned) return undefined;

    const words = cleaned
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
    const formatted = words.join(' ');
    if (!formatted) return undefined;

    if (/(County|Borough|Parish)$/i.test(formatted)) {
      return formatted;
    }

    return `${formatted} County`;
  }
}
