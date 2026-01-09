import { Body, Controller, Post, StreamableFile } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { ListingStatsDto } from './dto/listing-stats.dto';
import { ListingStatsResponseDto } from './dto/listing-stats-response.dto';
import { ListingStateBreakdownDto } from './dto/listing-state-breakdown.dto';
import { ListingStateBreakdownResponseDto } from './dto/listing-state-breakdown-response.dto';
import { PropertyListingsSearchDto } from './dto/property-listings-search.dto';
import { PropertyListingsSearchResponseDto } from './dto/property-listings-response.dto';
import { PropertyListingsExportDto } from './dto/property-listings-export.dto';

@ApiTags('properties')
@Controller('admin/properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @ApiOperation({ summary: 'Listing statistics summary (counts by status/state)' })
  @ApiOkResponse({ type: ListingStatsResponseDto })
  @Post('listings/stats/summary')
  async listingStats(@Body() dto: ListingStatsDto): Promise<ListingStatsResponseDto> {
    return this.propertiesService.getListingStats(dto);
  }

  @ApiOperation({ summary: 'Listing state/status breakdown with pagination' })
  @ApiOkResponse({ type: ListingStateBreakdownResponseDto })
  @Post('listings/stats/state-breakdown')
  async listingStateBreakdown(@Body() dto: ListingStateBreakdownDto): Promise<ListingStateBreakdownResponseDto> {
    return this.propertiesService.getListingStateBreakdown(dto);
  }

  @ApiOperation({ summary: 'Search property listings with rich filters' })
  @ApiOkResponse({ type: PropertyListingsSearchResponseDto })
  @Post('listings/search')
  async searchListings(@Body() dto: PropertyListingsSearchDto): Promise<PropertyListingsSearchResponseDto> {
    return this.propertiesService.searchListings(dto);
  }

  @ApiOperation({ summary: 'Export property listings as CSV (optimized)' })
  @ApiOkResponse({
    description: 'CSV file download',
    schema: { type: 'string', format: 'binary' },
  })
  @Post('listings/export/csv')
  async exportListingsCsvOptimized(@Body() dto: PropertyListingsExportDto): Promise<StreamableFile> {
    return this.propertiesService.exportListingsCsvOptimized(dto);
  }
}
