import { Injectable, StreamableFile } from '@nestjs/common';
import { PropertyListingRepository } from '../../repositories/postgres/property/property-listing.repository';
import { ListingStatsDto } from './dto/listing-stats.dto';
import { ListingStatsResponseDto } from './dto/listing-stats-response.dto';
import { ListingStateBreakdownDto } from './dto/listing-state-breakdown.dto';
import { ListingStateBreakdownResponseDto } from './dto/listing-state-breakdown-response.dto';
import { PropertyListingsSearchDto } from './dto/property-listings-search.dto';
import { PropertyListingsSearchResponseDto } from './dto/property-listings-response.dto';
import { PropertyListingsExportDto } from './dto/property-listings-export.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly propertyListingRepository: PropertyListingRepository) {}

  // ===== ADMIN: Rich listing search with filters/pagination
  async searchListings(dto: PropertyListingsSearchDto): Promise<PropertyListingsSearchResponseDto> {
    return this.propertyListingRepository.searchListingsOptimized(dto);
  }

  async exportListingsCsvOptimized(dto: PropertyListingsExportDto): Promise<StreamableFile> {
    return this.propertyListingRepository.exportListingsCsvOptimized(dto);
  }

  // ===== ADMIN: Listing statistics (GET/POST /admin/properties/stats)
  async getListingStats(dto: ListingStatsDto): Promise<ListingStatsResponseDto> {
    return this.propertyListingRepository.getListingStats(dto);
  }

  // ===== ADMIN: Listing state/status breakdown with pagination
  async getListingStateBreakdown(dto: ListingStateBreakdownDto): Promise<ListingStateBreakdownResponseDto> {
    return this.propertyListingRepository.getListingStateBreakdown(dto);
  }
}
