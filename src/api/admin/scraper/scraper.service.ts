import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { randomUUID } from 'crypto';
import { ScrapeRunsDynamoRepository } from '../../repositories/dynamodb/scrape-runs-dynamo.repository';
import { ScrapeJobsDynamoRepository } from '../../repositories/dynamodb/scrape-jobs-dynamo.repository';
import { ScrapeStateConfigDynamoRepository } from '../../repositories/dynamodb/scrape-state-config-dynamo.repository';
import { PropertiesOutreachDynamoRepository } from '../../repositories/dynamodb/properties-outreach-dynamo.repository';
import { PropertyPipelineStatsRepository } from '../../repositories/postgres/property/property-pipeline-stats.repository';
import { PropertySummaryRepository } from '../../repositories/postgres/property/property-summary.repository';
import { ScrapeRunsHealthDto } from './dto/scrape-runs-health.dto';
import { ScrapeRunsQueryDto } from './dto/scrape-runs-query.dto';
import { ScrapeRunsResponseDto } from './dto/scrape-runs-response.dto';
import { ScrapeRunsTotalsResponseDto } from './dto/scrape-runs-totals-response.dto';
import { ScrapeRunStateSummaryDto } from './dto/scrape-run-state-summary.dto';
import { PropertySummary } from '../../entities/property/property-summary.entity';
import { ScrapeJobsListQueryDto } from './dto/scrape-jobs-list-query.dto';
import { ScrapeJobsListResponseDto } from './dto/scrape-jobs-list-response.dto';
import { ScrapeRunsTotalsQueryDto } from './dto/scrape-runs-totals-query.dto';
import { ScrapeRunsRefreshDto } from './dto/scrape-runs-refresh.dto';
import { StatesAbbreviation } from '../../enums/common/states-abbreviation.enum';
import { ScrapeJobRunType } from '../../enums/scrape/scrape-job-run-type.enum';
import { ScrapeScheduleStateConfigDto } from './dto/scrape-schedule-state-config.dto';
import { ScrapeScheduleStateConfigResponseDto } from './dto/scrape-schedule-state-config-response.dto';
import { ScrapeRunStepState } from '../../enums/scrape/scrape-run-step-state.enum';
import { ZillowCookiesDynamoRepository } from '../../repositories/dynamodb/zillow-cookies-dynamo.repository';
import { ZillowCookiesListQueryDto } from './dto/zillow-cookies-list-query.dto';
import { ZillowCookiesListResponseDto } from './dto/zillow-cookies-list-response.dto';
import { ZillowCookiesBulkSetActiveDto } from './dto/zillow-cookies-bulk-set-active.dto';
import { ZillowCookiesBulkActionResponseDto } from './dto/zillow-cookies-bulk-action-response.dto';
import { ZillowCookiesCreateDto } from './dto/zillow-cookies-create.dto';
import { ZillowCookiesCreateResponseDto } from './dto/zillow-cookies-create-response.dto';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private refreshInProgress = false;

  constructor(
    private readonly scrapeRunsRepo: ScrapeRunsDynamoRepository,
    private readonly scrapeJobsRepo: ScrapeJobsDynamoRepository,
    private readonly scrapeStateConfigRepo: ScrapeStateConfigDynamoRepository,
    private readonly propertiesOutreachRepo: PropertiesOutreachDynamoRepository,
    private readonly zillowCookiesRepo: ZillowCookiesDynamoRepository,
    private readonly propertyPipelineStatsRepo: PropertyPipelineStatsRepository,
    private readonly propertySummaryRepo: PropertySummaryRepository,
  ) {}

  async health(): Promise<ScrapeRunsHealthDto> {
    return this.scrapeRunsRepo.healthCheck();
  }

  async listRuns(dto: ScrapeRunsQueryDto): Promise<ScrapeRunsResponseDto> {
    const runDate = dto.runDate || this.getLocalDateString();
    const storedRows = await this.propertySummaryRepo.findByRunDate(runDate);
    const mergedStates = this.buildStateSummariesFromStored(storedRows);

    const limit = Math.min(Math.max(dto.limit ?? 50, 1), 100);
    const offset = Math.max(dto.offset ?? 0, 0);
    const totalRecords = mergedStates.length;
    const totalPages = totalRecords > 0 ? Math.max(1, Math.ceil(totalRecords / limit)) : 1;
    const currentPage = Math.floor(offset / limit) + 1;
    const paged = mergedStates.slice(offset, offset + limit);

    return {
      result: paged,
      totalRecords,
      currentPage,
      totalPages,
      limit,
      offset,
    };
  }

  async listDashboardTotals(dto: ScrapeRunsTotalsQueryDto): Promise<ScrapeRunsTotalsResponseDto> {
    const fallbackDate = this.getLocalDateString();
    const runDateFrom = dto.runDateFrom || dto.runDateTo || fallbackDate;
    const runDateTo = dto.runDateTo || dto.runDateFrom || fallbackDate;
    const [summaryTotals, latestTotals] = await Promise.all([
      this.propertySummaryRepo.getTotalsByDateRange(runDateFrom, runDateTo),
      this.propertySummaryRepo.getTotalsByLatestRunDate(),
    ]);
    return {
      enrichedRemaining: latestTotals.enrichedRemaining ?? 0,
      enrichedCompleted: summaryTotals.enrichedCompleted ?? 0,
      mosaicRemaining: latestTotals.mosaicRemaining ?? 0,
      mosaicCompleted: summaryTotals.mosaicCompleted ?? 0,
      filteredRemaining: latestTotals.filteredRemaining ?? 0,
      filteredCompleted: summaryTotals.filteredCompleted ?? 0,
      importCompleted: summaryTotals.importCompleted ?? 0,
      importRemaining: latestTotals.importRemaining ?? 0,
      completedScrapingJobs: summaryTotals.success ?? 0,
      remainingScrapingJobs: latestTotals.remaining ?? 0,
    };
  }

  async listJobs(dto: ScrapeJobsListQueryDto): Promise<ScrapeJobsListResponseDto> {
    return this.scrapeJobsRepo.listJobsPaged(dto);
  }

  async listZillowCookies(dto: ZillowCookiesListQueryDto): Promise<ZillowCookiesListResponseDto> {
    return this.zillowCookiesRepo.listCookies(dto);
  }

  async setZillowCookiesActive(
    dto: ZillowCookiesBulkSetActiveDto,
  ): Promise<ZillowCookiesBulkActionResponseDto> {
    return this.zillowCookiesRepo.setCookiesActive(dto);
  }

  async createZillowCookies(dto: ZillowCookiesCreateDto): Promise<ZillowCookiesCreateResponseDto> {
    return this.zillowCookiesRepo.createCookies(dto);
  }

  async refreshRunsSummary(dto: ScrapeRunsRefreshDto): Promise<ScrapeRunsTotalsResponseDto> {
    const runDate = dto.runDate || this.getLocalDateString();
    const [states, pipelineStatsByState, outreachRemainingByState] = await Promise.all([
      this.scrapeJobsRepo.summarizeJobsByRunDate(runDate),
      this.propertyPipelineStatsRepo.getPipelineStatsByState(runDate),
      this.propertiesOutreachRepo.countOutreachRemainingByState(),
    ]);

    const pipelinePerState = pipelineStatsByState.perState;
    const rows = states.map((stateSummary) => {
      const pipeline = pipelinePerState.get(stateSummary.state);
      const importRemaining = outreachRemainingByState.get(stateSummary.state) ?? 0;
      const totalJobs = stateSummary.totalJobs ?? 0;
      const success = stateSummary.success ?? 0;
      return {
        runDate,
        state: stateSummary.state,
        totalJobs,
        success,
        pending: stateSummary.pending ?? 0,
        running: stateSummary.running ?? 0,
        failed: stateSummary.failed ?? 0,
        retrying: stateSummary.retrying ?? 0,
        changedCount: stateSummary.changedCount ?? 0,
        newCount: stateSummary.newCount ?? 0,
        changedAndNewCount: stateSummary.changedAndNewCount ?? 0,
        remaining: Math.max(0, totalJobs - success),
        enrichedRemaining: pipeline?.enrichedRemaining ?? 0,
        enrichedCompleted: pipeline?.enrichedCompleted ?? 0,
        mosaicRemaining: pipeline?.mosaicRemaining ?? 0,
        mosaicCompleted: pipeline?.mosaicCompleted ?? 0,
        filteredRemaining: pipeline?.filteredRemaining ?? 0,
        filteredCompleted: pipeline?.filteredCompleted ?? 0,
        importCompleted: pipeline?.importCompleted ?? 0,
        importRemaining,
      };
    });

    await this.propertySummaryRepo.upsertRows(rows);

    const totals = rows.reduce(
      (acc, row) => {
        acc.enrichedRemaining += row.enrichedRemaining;
        acc.enrichedCompleted += row.enrichedCompleted;
        acc.mosaicRemaining += row.mosaicRemaining;
        acc.mosaicCompleted += row.mosaicCompleted;
        acc.filteredRemaining += row.filteredRemaining;
        acc.filteredCompleted += row.filteredCompleted;
        acc.importCompleted += row.importCompleted;
        acc.importRemaining += row.importRemaining;
        acc.completedScrapingJobs += row.success;
        acc.remainingScrapingJobs += row.remaining;
        return acc;
      },
      {
        enrichedRemaining: 0,
        enrichedCompleted: 0,
        mosaicRemaining: 0,
        mosaicCompleted: 0,
        filteredRemaining: 0,
        filteredCompleted: 0,
        importCompleted: 0,
        importRemaining: 0,
        completedScrapingJobs: 0,
        remainingScrapingJobs: 0,
      },
    );

    return totals;
  }

  async scheduleStateConfigJobs(
    dto: ScrapeScheduleStateConfigDto,
  ): Promise<ScrapeScheduleStateConfigResponseDto> {
    const runDate = dto.runDate || this.getLocalDateString();
    const runType = ScrapeJobRunType.PENDING;

    const configs = await this.scrapeStateConfigRepo.listStateConfigs();
    const targetStates = dto.states?.map((state) => state.toUpperCase());
    const targetSet = targetStates ? new Set(targetStates) : undefined;

    const jobsByState: Record<string, number> = {};
    let totalJobs = 0;

    for (const config of configs) {
      const state = typeof config.state === 'string' ? config.state.toUpperCase() : '';
      if (!state) continue;
      if (targetSet && !targetSet.has(state)) continue;

      if (runType === ScrapeJobRunType.PENDING && !config.isPendingEnabled) {
        continue;
      }

      const zillowLink =
        typeof config.zillow_link === 'string'
          ? config.zillow_link.trim()
          : typeof config.zillowLink === 'string'
            ? config.zillowLink.trim()
            : '';
      const zdefs = this.normalizeZillowDefineInput(config.zillow_define_input ?? config.zillowDefineInput);
      if (!zillowLink || zdefs.length === 0) continue;

      const segmentCount = zdefs.length;
      const normalizedRunType = this.normalizeRunTypeToken(runType);
      const nowIso = new Date().toISOString();

      const jobs = zdefs.map((zdef, idx) => {
        const segmentIndex = idx + 1;
        const segmentId = `${state}${segmentIndex}`;
        const stateSegment = `${state}#${segmentIndex}`;
        const stateSegmentRunKey = `${stateSegment}#${normalizedRunType}#${runDate}`;

        return {
          jobId: randomUUID(),
          state,
          countyId: segmentId,
          segmentId,
          stateSegment,
          stateSegmentRunKey,
          segmentIndex,
          segmentCount,
          runType: normalizedRunType,
          zillow_link: zillowLink,
          zillow_define_input: zdef,
          status: 'PENDING',
          failCount: 0,
          scheduledDate: runDate,
          createdAt: nowIso,
          _acquire_run_lock: false,
          jobSource: 'STATE_CONFIG',
        };
      });

      await this.scrapeJobsRepo.createJobs(jobs);
      jobsByState[state] = jobs.length;
      totalJobs += jobs.length;
    }

    return {
      runDate,
      runType,
      jobsByState: Object.entries(jobsByState)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([state, jobs]) => ({
          state: state as StatesAbbreviation,
          jobs,
        })),
      totalJobs,
    };
  }

 @Cron(CronExpression.EVERY_30_MINUTES)
  async refreshRunsSummaryCron(): Promise<void> {
    if (this.refreshInProgress) return;
    this.refreshInProgress = true;
    try {
      await this.refreshRunsSummary({});
    } catch (err) {
      this.logger.error(`runs/refresh failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.refreshInProgress = false;
    }
  }

  private buildStateSummariesFromStored(rows: PropertySummary[]): ScrapeRunStateSummaryDto[] {
    const summaries = new Map<StatesAbbreviation, ScrapeRunStateSummaryDto>();
    for (const state of Object.values(StatesAbbreviation)) {
      summaries.set(state, {
        state,
        scrapeCompleted: 0,
        scrapeRemaining: 0,
        scrapeStatus: ScrapeRunStepState.NOT_SCHEDULED,
        enrichedRemaining: 0,
        enrichedCompleted: 0,
        enrichStatus: ScrapeRunStepState.NOT_SCHEDULED,
        mosaicRemaining: 0,
        mosaicCompleted: 0,
        mosaicStatus: ScrapeRunStepState.NOT_SCHEDULED,
        filteredRemaining: 0,
        filteredCompleted: 0,
        filterStatus: ScrapeRunStepState.NOT_SCHEDULED,
        importCompleted: 0,
        importRemaining: 0,
        importStatus: ScrapeRunStepState.NOT_SCHEDULED,
      });
    }

    for (const row of rows ?? []) {
      const state = row.state as StatesAbbreviation | undefined;
      if (!state || !summaries.has(state)) continue;
      const success = Number(row.success ?? 0);
      const remaining =
        row.remaining !== undefined && row.remaining !== null
          ? Number(row.remaining)
          : Math.max(0, Number(row.totalJobs ?? 0) - success);
      const scrapeCompleted = success;
      const scrapeRemaining = Number.isFinite(remaining) ? remaining : 0;
      const enrichedCompleted = Number(row.enrichedCompleted ?? 0);
      const enrichedRemaining = Number(row.enrichedRemaining ?? 0);
      const mosaicCompleted = Number(row.mosaicCompleted ?? 0);
      const mosaicRemaining = Number(row.mosaicRemaining ?? 0);
      const filteredCompleted = Number(row.filteredCompleted ?? 0);
      const filteredRemaining = Number(row.filteredRemaining ?? 0);
      const importCompleted = Number(row.importCompleted ?? 0);
      const importRemaining = Number(row.importRemaining ?? 0);

      summaries.set(state, {
        state,
        scrapeCompleted,
        scrapeRemaining,
        scrapeStatus: this.resolveStepState(scrapeCompleted, scrapeRemaining),
        enrichedRemaining,
        enrichedCompleted,
        enrichStatus: this.resolveStepState(enrichedCompleted, enrichedRemaining),
        mosaicRemaining,
        mosaicCompleted,
        mosaicStatus: this.resolveStepState(mosaicCompleted, mosaicRemaining),
        filteredRemaining,
        filteredCompleted,
        filterStatus: this.resolveStepState(filteredCompleted, filteredRemaining),
        importCompleted,
        importRemaining,
        importStatus: this.resolveStepState(importCompleted, importRemaining),
      });
    }

    return Array.from(summaries.values());
  }

  private getLocalDateString(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private normalizeZillowDefineInput(value: unknown): Array<Record<string, any>> {
    if (Array.isArray(value)) return value as Array<Record<string, any>>;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? (parsed as Array<Record<string, any>>) : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private normalizeRunTypeToken(runType: ScrapeJobRunType): string {
    return runType.toUpperCase().replace(/[^A-Z0-9]/g, '');
  }


  private resolveStepState(completed: number, remaining: number): ScrapeRunStepState {
    const completedSafe = Number.isFinite(completed) ? completed : 0;
    const remainingSafe = Number.isFinite(remaining) ? remaining : 0;
    if (completedSafe === 0 && remainingSafe === 0) return ScrapeRunStepState.NOT_SCHEDULED;
    if (completedSafe === 0 && remainingSafe > 0) return ScrapeRunStepState.NOT_STARTED;
    if (completedSafe > 0 && remainingSafe > 0) return ScrapeRunStepState.RUNNING;
    return ScrapeRunStepState.COMPLETED;
  }

  private makeQueueSort(status: string, priority: number, timestampMs: number): string {
    const priorityString = Math.max(0, priority).toString().padStart(3, '0');
    return `${status}#${priorityString}#${timestampMs}`;
  }

  private getStatePriority(stateConfig: Record<string, any>): number {
    const raw = stateConfig?.priority ?? process.env.SCRAPE_RUNS_DEFAULT_PRIORITY;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 10;
  }
}
