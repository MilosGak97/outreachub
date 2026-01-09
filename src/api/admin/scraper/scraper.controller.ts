import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ScraperService } from './scraper.service';
import { ScrapeRunsHealthDto } from './dto/scrape-runs-health.dto';
import { ScrapeRunsQueryDto } from './dto/scrape-runs-query.dto';
import { ScrapeRunsResponseDto } from './dto/scrape-runs-response.dto';
import { ScrapeRunsTotalsResponseDto } from './dto/scrape-runs-totals-response.dto';
import { ScrapeScheduleStateConfigDto } from './dto/scrape-schedule-state-config.dto';
import { ScrapeScheduleStateConfigResponseDto } from './dto/scrape-schedule-state-config-response.dto';
import { ScrapeJobsListQueryDto } from './dto/scrape-jobs-list-query.dto';
import { ScrapeJobsListResponseDto } from './dto/scrape-jobs-list-response.dto';
import { ScrapeRunsTotalsQueryDto } from './dto/scrape-runs-totals-query.dto';
import { ScrapeRunsRefreshDto } from './dto/scrape-runs-refresh.dto';
import { ZillowCookiesListQueryDto } from './dto/zillow-cookies-list-query.dto';
import { ZillowCookiesListResponseDto } from './dto/zillow-cookies-list-response.dto';
import { ZillowCookiesBulkSetActiveDto } from './dto/zillow-cookies-bulk-set-active.dto';
import { ZillowCookiesBulkActionResponseDto } from './dto/zillow-cookies-bulk-action-response.dto';
import { ZillowCookiesCreateDto } from './dto/zillow-cookies-create.dto';
import { ZillowCookiesCreateResponseDto } from './dto/zillow-cookies-create-response.dto';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminRole } from '../../enums/admin/admin-role.enum';

/**
 * # Scraper Module
 *
 * Manages the property scraping pipeline from Zillow. The pipeline has 5 stages:
 *
 * ```
 * SCRAPE → IMPORT → ENRICH → MOSAIC → FILTER
 * ```
 *
 * ## Pipeline Stages:
 * 1. **SCRAPE**: Fetch property listings from Zillow by state/segment
 * 2. **IMPORT**: Move scraped data from DynamoDB to PostgreSQL
 * 3. **ENRICH**: Add extra property data (demographics, market data)
 * 4. **MOSAIC**: Analyze property images using AI
 * 5. **FILTER**: Apply AI/rules to qualify leads
 *
 * ## Data Flow:
 * - Jobs are created per state segment (e.g., CA#1, CA#2, TX#1)
 * - Each job tracks: status, result counts, new/changed properties
 * - Dashboard shows aggregated totals across all states
 */
@ApiTags('scraper')
@ApiBearerAuth()
@Controller('admin/scraper')
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.HEAD)
export class ScraperController {
  constructor(private readonly scraperService: ScraperService) {}

  // ═══════════════════════════════════════════════════════════════
  // HEALTH & MONITORING
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({
    summary: 'Health check',
    description: `Verify connectivity to DynamoDB scraper tables.

**Use this to:**
- Check if DynamoDB is reachable
- Verify table permissions are correct
- Debug connection issues

**Returns:** Connection status and latency for each table.`,
  })
  @ApiOkResponse({
    type: ScrapeRunsHealthDto,
    description: 'Health status of scraper dependencies',
  })
  @Get('health')
  async health(): Promise<ScrapeRunsHealthDto> {
    return this.scraperService.health();
  }

  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD & RUNS
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({
    summary: 'Get dashboard totals',
    description: `Fetch aggregated pipeline statistics for the dashboard cards.

**Pipeline Metrics Returned:**
| Metric | Description |
|--------|-------------|
| \`completedScrapingJobs\` | Jobs that finished scraping successfully |
| \`remainingScrapingJobs\` | Jobs pending or in progress |
| \`enrichedCompleted/Remaining\` | Properties enriched vs pending |
| \`mosaicCompleted/Remaining\` | Properties with image analysis |
| \`filteredCompleted/Remaining\` | Properties qualified vs pending |
| \`importCompleted/Remaining\` | Records imported to PostgreSQL |

**Date Range:**
- If no dates provided, returns totals for today
- Supports date range for historical analysis
`,
  })
  @ApiOkResponse({
    type: ScrapeRunsTotalsResponseDto,
    description: 'Aggregated totals for all pipeline stages',
  })
  @Get('dashboard')
  async dashboard(@Query() query: ScrapeRunsTotalsQueryDto): Promise<ScrapeRunsTotalsResponseDto> {
    return this.scraperService.listDashboardTotals(query);
  }

  @ApiOperation({
    summary: 'List scrape runs by state',
    description: `Get per-state breakdown of pipeline progress.

**Each state shows:**
- Scraping progress (completed/remaining jobs)
- Import progress (DynamoDB → PostgreSQL)
- Enrichment progress
- Mosaic (image analysis) progress
- Filtering progress

**Status Values:**
- \`NOT_SCHEDULED\`: No jobs created for this stage
- \`NOT_STARTED\`: Jobs exist but none completed
- \`RUNNING\`: Some jobs completed, some remaining
- \`COMPLETED\`: All jobs finished

**Pagination:**
- Returns all 50 US states plus territories
- Use \`limit\` and \`offset\` for pagination
`,
  })
  @ApiOkResponse({
    type: ScrapeRunsResponseDto,
    description: 'Paginated list of per-state pipeline statistics',
  })
  @Get('runs')
  async listRuns(@Query() query: ScrapeRunsQueryDto): Promise<ScrapeRunsResponseDto> {
    return this.scraperService.listRuns(query);
  }

  @ApiOperation({
    summary: 'Refresh run summaries',
    description: `Rebuild per-state run summaries and totals for a given run date.

**Use this to:**
- Recompute dashboard totals after backfills
- Fix stale or inconsistent state summaries
- Force refresh after manual job updates

**Optional input:**
- \`runDate\` (YYYY-MM-DD). Defaults to today if omitted.
`,
  })
  @ApiBody({ type: ScrapeRunsRefreshDto, required: false })
  @ApiOkResponse({
    type: ScrapeRunsTotalsResponseDto,
    description: 'Recalculated pipeline totals for the selected run date',
  })
  @Post('runs-fetch')
  async refreshRunsSummary(@Body() body: ScrapeRunsRefreshDto): Promise<ScrapeRunsTotalsResponseDto> {
    return this.scraperService.refreshRunsSummary(body ?? {});
  }

  // ═══════════════════════════════════════════════════════════════
  // JOBS MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({
    summary: 'List scrape jobs',
    description: `Browse individual scraping jobs with detailed status.

**Job Structure:**
Each state is split into segments (e.g., CA has 50+ segments for different Zillow search areas).
Each segment becomes a job with:
- \`jobId\`: Unique identifier
- \`state\`: US state abbreviation
- \`segmentIndex\`: Segment number within state (1, 2, 3...)
- \`status\`: PENDING, RUNNING, SUCCESS, FAILED, RETRYING
- \`resultCount\`: Total properties found
- \`newCount\`: New properties (not seen before)
- \`changedCount\`: Properties with updated data

**Filtering:**
- \`statuses\`: Filter by job status
- \`states\`: Filter by US states
- \`createdFrom/To\`: Date range filter
- \`resultCountMin/Max\`: Filter by result count
`,
  })
  @ApiOkResponse({
    type: ScrapeJobsListResponseDto,
    description: 'Paginated list of scraping jobs',
  })
  @Get('jobs')
  async listJobs(@Query() query: ScrapeJobsListQueryDto): Promise<ScrapeJobsListResponseDto> {
    return this.scraperService.listJobs(query);
  }

  @ApiOperation({
    summary: 'Schedule scraping jobs',
    description: `Create new scraping jobs for selected states.

**How Scheduling Works:**
1. Reads state configurations from DynamoDB (zillow_link, segments)
2. Creates one job per segment for each state
3. Jobs start with status \`PENDING\`
4. Worker processes pick up and execute jobs

**Segment Example:**
California might have 50 segments (different Zillow search URLs).
Calling this endpoint for CA creates 50 jobs:
- CA#1, CA#2, ..., CA#50

**Request Options:**
- \`states\`: Array of state abbreviations (empty = all states)
- \`runDate\`: Target date (default: today)

**Response:**
Returns count of jobs created per state.
`,
  })
  @ApiBody({ type: ScrapeScheduleStateConfigDto })
  @ApiOkResponse({
    type: ScrapeScheduleStateConfigResponseDto,
    description: 'Summary of jobs created per state',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid state abbreviation or date format',
  })
  @Post('schedule')
  async scheduleStateConfigJobs(
    @Body() body: ScrapeScheduleStateConfigDto,
  ): Promise<ScrapeScheduleStateConfigResponseDto> {
    return this.scraperService.scheduleStateConfigJobs(body);
  }

  // ═══════════════════════════════════════════════════════════════
  // ZILLOW COOKIES MANAGEMENT
  // ═══════════════════════════════════════════════════════════════

  @ApiOperation({
    summary: 'List Zillow cookies',
    description: `Manage authentication cookies for Zillow scraping.

**Why Cookies Matter:**
Zillow requires authenticated sessions for scraping. Cookies are rotated
to avoid rate limiting and detection.

**Cookie Properties:**
- \`cookieId\`: Unique identifier
- \`cookie\`: The actual cookie string
- \`isActive\`: Whether this cookie is in rotation
- \`lastUsedAt\`: When it was last used for scraping
- \`failCount\`: Number of failed requests

**Pagination:**
Use \`limit\` and \`offset\` for large cookie pools.
`,
  })
  @ApiOkResponse({
    type: ZillowCookiesListResponseDto,
    description: 'Paginated list of Zillow cookies',
  })
  @Get('cookies')
  async listCookies(@Query() query: ZillowCookiesListQueryDto): Promise<ZillowCookiesListResponseDto> {
    return this.scraperService.listZillowCookies(query);
  }

  @ApiOperation({
    summary: 'Bulk toggle cookies active state',
    description: `Enable or disable multiple cookies at once.

**Use Cases:**
- Disable all cookies from a specific source
- Re-enable a batch of cookies after cooldown
- Emergency: disable all cookies if Zillow is blocking
`,
  })
  @ApiBody({ type: ZillowCookiesBulkSetActiveDto })
  @ApiOkResponse({
    type: ZillowCookiesBulkActionResponseDto,
    description: 'Summary of updated cookies',
  })
  @Patch('cookies/active')
  async setCookiesActive(
    @Body() body: ZillowCookiesBulkSetActiveDto,
  ): Promise<ZillowCookiesBulkActionResponseDto> {
    return this.scraperService.setZillowCookiesActive(body);
  }

  @ApiOperation({
    summary: 'Add new Zillow cookies',
    description: `Import new authentication cookies for scraping.

**Cookie Format:**
Provide raw cookie strings extracted from browser developer tools.

**Process:**
1. Extract cookies from authenticated Zillow session
2. Submit via this endpoint
3. Cookies are validated and added to rotation pool
`,
  })
  @ApiBody({ type: ZillowCookiesCreateDto })
  @ApiOkResponse({
    type: ZillowCookiesCreateResponseDto,
    description: 'Summary of created cookies',
  })
  @ApiResponse({ status: 400, description: 'Invalid cookie format' })
  @Post('cookies')
  async createCookies(
    @Body() body: ZillowCookiesCreateDto,
  ): Promise<ZillowCookiesCreateResponseDto> {
    return this.scraperService.createZillowCookies(body);
  }
}
