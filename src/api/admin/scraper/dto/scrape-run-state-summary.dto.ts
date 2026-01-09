import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { StatesAbbreviation } from '../../../enums/common/states-abbreviation.enum';
import { ScrapeRunStepState } from '../../../enums/scrape/scrape-run-step-state.enum';

/**
 * Per-state pipeline progress summary.
 *
 * Shows completed/remaining counts and status for each pipeline stage.
 *
 * @example
 * {
 *   "state": "CA",
 *   "scrapeCompleted": 45,
 *   "scrapeRemaining": 5,
 *   "scrapeStatus": "RUNNING",
 *   "importCompleted": 12500,
 *   "importRemaining": 2500,
 *   "importStatus": "RUNNING",
 *   "enrichedCompleted": 10000,
 *   "enrichedRemaining": 5000,
 *   "enrichStatus": "RUNNING",
 *   "mosaicCompleted": 8000,
 *   "mosaicRemaining": 7000,
 *   "mosaicStatus": "RUNNING",
 *   "filteredCompleted": 6000,
 *   "filteredRemaining": 9000,
 *   "filterStatus": "RUNNING"
 * }
 */
export class ScrapeRunStateSummaryDto {
  @ApiProperty({
    description: 'US state abbreviation (e.g., CA, TX, FL)',
    enum: StatesAbbreviation,
    enumName: 'StatesAbbreviation',
    example: 'CA',
  })
  state: StatesAbbreviation;

  // ═══════════════════════════════════════════════════════════════
  // SCRAPING STAGE
  // ═══════════════════════════════════════════════════════════════

  @ApiProperty({
    description: 'Number of scraping jobs completed for this state',
    example: 45,
    minimum: 0,
  })
  @Type(() => Number)
  scrapeCompleted: number;

  @ApiProperty({
    description: 'Number of scraping jobs remaining for this state',
    example: 5,
    minimum: 0,
  })
  @Type(() => Number)
  scrapeRemaining: number;

  @ApiProperty({
    description: `Scraping stage status.

| Status | Meaning |
|--------|---------|
| \`NOT_SCHEDULED\` | No jobs created |
| \`NOT_STARTED\` | Jobs exist, none completed |
| \`RUNNING\` | Some completed, some remaining |
| \`COMPLETED\` | All jobs finished |`,
    enum: ScrapeRunStepState,
    enumName: 'ScrapeRunStepState',
    example: 'RUNNING',
  })
  scrapeStatus: ScrapeRunStepState;

  // ═══════════════════════════════════════════════════════════════
  // IMPORT STAGE
  // ═══════════════════════════════════════════════════════════════

  @ApiProperty({
    description: 'Number of properties imported from DynamoDB to PostgreSQL',
    example: 12500,
    minimum: 0,
  })
  @Type(() => Number)
  importCompleted: number;

  @ApiProperty({
    description: 'Number of properties waiting to be imported',
    example: 2500,
    minimum: 0,
  })
  @Type(() => Number)
  importRemaining: number;

  @ApiProperty({
    description: 'Import stage status',
    enum: ScrapeRunStepState,
    enumName: 'ScrapeRunStepState',
    example: 'RUNNING',
  })
  importStatus: ScrapeRunStepState;

  // ═══════════════════════════════════════════════════════════════
  // ENRICHMENT STAGE
  // ═══════════════════════════════════════════════════════════════

  @ApiProperty({
    description: 'Number of properties waiting for enrichment',
    example: 5000,
    minimum: 0,
  })
  @Type(() => Number)
  enrichedRemaining: number;

  @ApiProperty({
    description: 'Number of properties with enrichment completed',
    example: 10000,
    minimum: 0,
  })
  @Type(() => Number)
  enrichedCompleted: number;

  @ApiProperty({
    description: 'Enrichment stage status',
    enum: ScrapeRunStepState,
    enumName: 'ScrapeRunStepState',
    example: 'RUNNING',
  })
  enrichStatus: ScrapeRunStepState;

  // ═══════════════════════════════════════════════════════════════
  // MOSAIC STAGE (Image Analysis)
  // ═══════════════════════════════════════════════════════════════

  @ApiProperty({
    description: 'Number of properties waiting for image analysis',
    example: 7000,
    minimum: 0,
  })
  @Type(() => Number)
  mosaicRemaining: number;

  @ApiProperty({
    description: 'Number of properties with image analysis completed',
    example: 8000,
    minimum: 0,
  })
  @Type(() => Number)
  mosaicCompleted: number;

  @ApiProperty({
    description: 'Mosaic (image analysis) stage status',
    enum: ScrapeRunStepState,
    enumName: 'ScrapeRunStepState',
    example: 'RUNNING',
  })
  mosaicStatus: ScrapeRunStepState;

  // ═══════════════════════════════════════════════════════════════
  // FILTER STAGE (Lead Qualification)
  // ═══════════════════════════════════════════════════════════════

  @ApiProperty({
    description: 'Number of properties that passed through filtering',
    example: 6000,
    minimum: 0,
  })
  @Type(() => Number)
  filteredCompleted: number;

  @ApiProperty({
    description: 'Number of properties waiting to be filtered',
    example: 9000,
    minimum: 0,
  })
  @Type(() => Number)
  filteredRemaining: number;

  @ApiProperty({
    description: 'Filter stage status',
    enum: ScrapeRunStepState,
    enumName: 'ScrapeRunStepState',
    example: 'RUNNING',
  })
  filterStatus: ScrapeRunStepState;
}
