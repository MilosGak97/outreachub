import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Dashboard totals showing pipeline progress across all states.
 *
 * Each pipeline stage has two metrics:
 * - `completed`: Records that finished this stage
 * - `remaining`: Records waiting to be processed
 *
 * @example
 * {
 *   "completedScrapingJobs": 450,
 *   "remainingScrapingJobs": 50,
 *   "importCompleted": 125000,
 *   "importRemaining": 25000,
 *   "enrichedCompleted": 100000,
 *   "enrichedRemaining": 50000,
 *   "mosaicCompleted": 80000,
 *   "mosaicRemaining": 70000,
 *   "filteredCompleted": 60000,
 *   "filteredRemaining": 90000
 * }
 */
export class ScrapeRunsTotalsResponseDto {
  // ═══════════════════════════════════════════════════════════════
  // STAGE 1: SCRAPING (Zillow → DynamoDB)
  // ═══════════════════════════════════════════════════════════════

  @ApiProperty({
    description: `Number of scraping jobs completed successfully.

Each job scrapes one segment of a state (e.g., CA#1, CA#2).
A typical full run has ~500-1000 jobs across all states.`,
    example: 450,
    minimum: 0,
  })
  @Type(() => Number)
  completedScrapingJobs: number;

  @ApiProperty({
    description: `Number of scraping jobs still pending or in progress.

**Progress calculation:**
\`\`\`typescript
const progress = completedScrapingJobs / (completedScrapingJobs + remainingScrapingJobs);
\`\`\``,
    example: 50,
    minimum: 0,
  })
  @Type(() => Number)
  remainingScrapingJobs: number;

  // ═══════════════════════════════════════════════════════════════
  // STAGE 2: IMPORT (DynamoDB → PostgreSQL)
  // ═══════════════════════════════════════════════════════════════

  @ApiProperty({
    description: `Number of properties imported from DynamoDB to PostgreSQL.

Import converts raw scraped data into structured property records.`,
    example: 125000,
    minimum: 0,
  })
  @Type(() => Number)
  importCompleted: number;

  @ApiProperty({
    description: `Number of properties waiting to be imported.

High numbers here indicate the IMPORT worker needs to run.`,
    example: 25000,
    minimum: 0,
  })
  @Type(() => Number)
  importRemaining: number;

  // ═══════════════════════════════════════════════════════════════
  // STAGE 3: ENRICHMENT (Add demographics, market data)
  // ═══════════════════════════════════════════════════════════════

  @ApiProperty({
    description: `Number of properties with enrichment data added.

Enrichment adds: demographics, market trends, neighborhood scores, etc.`,
    example: 100000,
    minimum: 0,
  })
  @Type(() => Number)
  enrichedCompleted: number;

  @ApiProperty({
    description: `Number of properties waiting for enrichment.

High numbers here indicate the ENRICH worker needs to run.`,
    example: 50000,
    minimum: 0,
  })
  @Type(() => Number)
  enrichedRemaining: number;

  // ═══════════════════════════════════════════════════════════════
  // STAGE 4: MOSAIC (AI Image Analysis)
  // ═══════════════════════════════════════════════════════════════

  @ApiProperty({
    description: `Number of properties with image analysis completed.

Mosaic uses AI to analyze property photos for condition, features, etc.`,
    example: 80000,
    minimum: 0,
  })
  @Type(() => Number)
  mosaicCompleted: number;

  @ApiProperty({
    description: `Number of properties waiting for image analysis.

High numbers here indicate the MOSAIC worker needs to run.`,
    example: 70000,
    minimum: 0,
  })
  @Type(() => Number)
  mosaicRemaining: number;

  // ═══════════════════════════════════════════════════════════════
  // STAGE 5: FILTERING (AI/Rules Lead Qualification)
  // ═══════════════════════════════════════════════════════════════

  @ApiProperty({
    description: `Number of properties that passed through the filter.

Filtering applies AI/rules to qualify leads based on criteria.`,
    example: 60000,
    minimum: 0,
  })
  @Type(() => Number)
  filteredCompleted: number;

  @ApiProperty({
    description: `Number of properties waiting to be filtered.

High numbers here indicate the FILTER worker needs to run.`,
    example: 90000,
    minimum: 0,
  })
  @Type(() => Number)
  filteredRemaining: number;
}
