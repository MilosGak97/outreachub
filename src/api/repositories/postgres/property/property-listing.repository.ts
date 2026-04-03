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
import {
  applyListingSearchFilters,
  applyListingSearchSort,
  createListingExportOptimizedQuery,
  createListingSearchOptimizedBaseQuery,
  createListingSearchOptimizedQuery,
  escapeCsvCell,
  getUtcTodayRangeIso,
  mapListingRawToItemDto,
  normalizeCsvDate,
  normalizeStatuses,
} from './property-listing.helpers';

@Injectable()
export class PropertyListingRepository extends Repository<PropertyListing> {
  constructor(private readonly dataSource: DataSource) {
    super(PropertyListing, dataSource.createEntityManager());
  }

  async searchListingsOptimized(dto: PropertyListingsSearchDto): Promise<PropertyListingsSearchResponseDto> {
    const limit = Math.min(dto.limit ?? 50, 500);
    const offset = dto.offset ?? 0;

    const countQb = createListingSearchOptimizedBaseQuery(this);
    applyListingSearchFilters(countQb, dto);
    const total = await countQb.getCount();

    const qb = createListingSearchOptimizedQuery(this);
    applyListingSearchFilters(qb, dto);
    qb.offset(offset).limit(limit);

    const rows = await qb.getRawMany<Record<string, any>>();
    const records: PropertyListingItemDto[] = rows.map((row) => mapListingRawToItemDto(row));

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

    const qb = createListingExportOptimizedQuery(this);

    applyListingSearchFilters(qb, dto);
    applyListingSearchSort(qb);

    const filename = `property-listings-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`;

    const csvStream = Readable.from(
      (async function* () {
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
                return normalizeCsvDate(rawValue);
              }
              return rawValue;
            });
            yield `${values.map((value) => escapeCsvCell(value)).join(',')}\n`;
          }

          processed += rows.length;
          if (rows.length < take) break;
        }
      })(),
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
      const range = getUtcTodayRangeIso();
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
      const statuses = normalizeStatuses(dto.statuses);
      if (statuses.length > 0) {
        qb.andWhere('pl.status IN (:...statuses)', { statuses });
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
      const range = getUtcTodayRangeIso();
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
      const statuses = normalizeStatuses(dto.statuses);
      if (statuses.length > 0) {
        qb.andWhere('pl.status IN (:...statuses)', { statuses });
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
}
