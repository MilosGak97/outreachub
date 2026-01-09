import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  AttributeValue,
  BatchWriteItemCommand,
  DynamoDBClient,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { ScrapeJobsListQueryDto } from '../../admin/scraper/dto/scrape-jobs-list-query.dto';
import { ScrapeJobsListResponseDto } from '../../admin/scraper/dto/scrape-jobs-list-response.dto';
import { ScrapeJobItemDto } from '../../admin/scraper/dto/scrape-job-item.dto';
import { StatesAbbreviation } from '../../enums/common/states-abbreviation.enum';
import { ScrapeJobStatus } from '../../enums/scrape/scrape-job-status.enum';

type ScrapeRunStateSummary = {
  state: StatesAbbreviation;
  totalJobs: number;
  pending: number;
  running: number;
  success: number;
  failed: number;
  retrying: number;
  changedCount: number;
  newCount: number;
  changedAndNewCount: number;
  remaining: number;
};

type ScrapeJobsListFilters = {
  statuses?: ScrapeJobStatus[];
  states?: StatesAbbreviation[];
  scheduledDates?: string[];
  createdFrom?: string;
  createdTo?: string;
  searchQuery?: string;
  resultCountMin?: number;
  resultCountMax?: number;
};

@Injectable()
export class ScrapeJobsDynamoRepository {
  private readonly logger = new Logger(ScrapeJobsDynamoRepository.name);
  private readonly tableName: string;
  private readonly scheduledDateIndexName?: string;

  constructor(private readonly dynamo: DynamoDBClient) {
    this.tableName = process.env.SCRAPE_JOBS_TABLE || 'scrape_jobs';
    this.scheduledDateIndexName =
      process.env.SCRAPE_JOBS_SCHEDULED_DATE_INDEX ||
      process.env.SCRAPE_JOBS_RUNDATE_INDEX ||
      'scheduledDate';
  }

  async summarizeJobsByRunDate(runDate: string): Promise<ScrapeRunStateSummary[]> {
    const items = await this.queryJobsByRunDate(runDate);
    const stateSummaries = this.initializeStateSummaries();
    const validStates = new Set(Object.values(StatesAbbreviation));

    const toNumber = (value: unknown): number => {
      if (value === undefined || value === null || value === '') return 0;
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    };

    const normalizeStatus = (value: unknown): ScrapeJobStatus | undefined => {
      if (typeof value !== 'string') return undefined;
      const raw = value.toUpperCase();
      return (Object.values(ScrapeJobStatus) as string[]).includes(raw)
        ? (raw as ScrapeJobStatus)
        : undefined;
    };

    for (const item of items) {
      const stateRaw = typeof item.state === 'string' ? item.state.toUpperCase() : undefined;
      if (!stateRaw || !validStates.has(stateRaw as StatesAbbreviation)) {
        continue;
      }

      const summary = stateSummaries.get(stateRaw as StatesAbbreviation);
      if (!summary) {
        continue;
      }

      summary.totalJobs += 1;

      const status = normalizeStatus(item.status);
      if (status === ScrapeJobStatus.SUCCESS) summary.success += 1;
      else if (status === ScrapeJobStatus.FAILED) summary.failed += 1;
      else if (status === ScrapeJobStatus.RUNNING) summary.running += 1;
      else if (status === ScrapeJobStatus.RETRYING) summary.retrying += 1;
      else summary.pending += 1;

      const changedCount = toNumber(item.changedCount);
      const newCount = toNumber(item.newCount);
      summary.changedCount += changedCount;
      summary.newCount += newCount;
      summary.changedAndNewCount += changedCount + newCount;
      summary.remaining = Math.max(0, summary.totalJobs - summary.success);
    }

    return Array.from(stateSummaries.values());
  }

  async createJobs(items: Array<Record<string, any>>): Promise<void> {
    if (!items || items.length === 0) return;
    const batches: Array<Array<Record<string, any>>> = [];
    for (let i = 0; i < items.length; i += 25) {
      batches.push(items.slice(i, i + 25));
    }

    for (const batch of batches) {
      let unprocessed: Record<string, any> | undefined = {
        [this.tableName]: batch.map((item) => ({
          PutRequest: { Item: marshall(item, { removeUndefinedValues: true }) },
        })),
      };

      let attempt = 0;
      while (unprocessed && Object.keys(unprocessed).length > 0) {
        const result = await this.dynamo.send(
          new BatchWriteItemCommand({
            RequestItems: unprocessed,
          }),
        );
        unprocessed = result.UnprocessedItems;
        if (unprocessed && Object.keys(unprocessed).length > 0) {
          attempt += 1;
          const delayMs = Math.min(1000, 200 * attempt);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        } else {
          break;
        }
      }
    }
  }

  async listJobs(filters: ScrapeJobsListFilters): Promise<Array<Record<string, any>>> {
    if (filters.scheduledDates && filters.scheduledDates.length > 0 && this.scheduledDateIndexName) {
      return this.listJobsByScheduledDates(filters);
    }

    const out: Array<Record<string, any>> = [];
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined;

    const expressionAttributeNames: Record<string, string> = {
      '#jobId': 'jobId',
      '#state': 'state',
      '#segmentIndex': 'segmentIndex',
      '#segmentCount': 'segmentCount',
      '#status': 'status',
      '#stateSegmentRunKey': 'stateSegmentRunKey',
      '#failCount': 'failCount',
      '#resultCount': 'resultCount',
      '#newCount': 'newCount',
      '#changedCount': 'changedCount',
      '#unchangedCount': 'unchangedCount',
      '#zillowLink': 'zillow_link',
      '#createdAt': 'createdAt',
    };

    const expressionAttributeValues: Record<string, AttributeValue> = {};
    const filterParts: string[] = [];

    if (filters.statuses && filters.statuses.length > 0) {
      const statusTokens = filters.statuses.map((status, idx) => {
        const key = `:status${idx}`;
        expressionAttributeValues[key] = { S: status };
        return key;
      });
      filterParts.push(`#status IN (${statusTokens.join(', ')})`);
    }

    if (filters.states && filters.states.length > 0) {
      const stateTokens = filters.states.map((state, idx) => {
        const key = `:state${idx}`;
        expressionAttributeValues[key] = { S: state.toUpperCase() };
        return key;
      });
      filterParts.push(`#state IN (${stateTokens.join(', ')})`);
    }

    if (filters.createdFrom && filters.createdTo) {
      expressionAttributeValues[':createdFrom'] = { S: filters.createdFrom };
      expressionAttributeValues[':createdTo'] = { S: filters.createdTo };
      filterParts.push('#createdAt BETWEEN :createdFrom AND :createdTo');
    } else if (filters.createdFrom) {
      expressionAttributeValues[':createdFrom'] = { S: filters.createdFrom };
      filterParts.push('#createdAt >= :createdFrom');
    } else if (filters.createdTo) {
      expressionAttributeValues[':createdTo'] = { S: filters.createdTo };
      filterParts.push('#createdAt <= :createdTo');
    }

    if (filters.searchQuery) {
      expressionAttributeValues[':searchQuery'] = { S: filters.searchQuery };
      filterParts.push('contains(#stateSegmentRunKey, :searchQuery)');
    }

    if (filters.resultCountMin !== undefined && filters.resultCountMax !== undefined) {
      expressionAttributeValues[':resultCountMin'] = { N: String(filters.resultCountMin) };
      expressionAttributeValues[':resultCountMax'] = { N: String(filters.resultCountMax) };
      filterParts.push('#resultCount BETWEEN :resultCountMin AND :resultCountMax');
    } else if (filters.resultCountMin !== undefined) {
      expressionAttributeValues[':resultCountMin'] = { N: String(filters.resultCountMin) };
      filterParts.push('#resultCount >= :resultCountMin');
    } else if (filters.resultCountMax !== undefined) {
      expressionAttributeValues[':resultCountMax'] = { N: String(filters.resultCountMax) };
      filterParts.push('#resultCount <= :resultCountMax');
    }

    const projectionExpression = [
      '#jobId',
      '#state',
      '#segmentIndex',
      '#segmentCount',
      '#status',
      '#stateSegmentRunKey',
      '#failCount',
      '#resultCount',
      '#newCount',
      '#changedCount',
      '#unchangedCount',
      '#zillowLink',
      '#createdAt',
    ].join(', ');

    const filterExpression = filterParts.length > 0 ? filterParts.join(' AND ') : undefined;

    do {
      try {
        const result = await this.dynamo.send(
          new ScanCommand({
            TableName: this.tableName,
            ProjectionExpression: projectionExpression,
            FilterExpression: filterExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues:
              Object.keys(expressionAttributeValues).length > 0 ? expressionAttributeValues : undefined,
            ExclusiveStartKey: lastEvaluatedKey,
          }),
        );

        out.push(...(result.Items ?? []).map((item) => unmarshall(item)));
        lastEvaluatedKey = result.LastEvaluatedKey;
      } catch (err) {
        this.logger.error(`Dynamo scrape_jobs scan failed: ${err}`);
        throw err;
      }
    } while (lastEvaluatedKey);

    return out;
  }

  async listJobsPaged(dto: ScrapeJobsListQueryDto): Promise<ScrapeJobsListResponseDto> {
    if (
      dto.resultCountMin !== undefined &&
      dto.resultCountMax !== undefined &&
      dto.resultCountMin > dto.resultCountMax
    ) {
      throw new BadRequestException('resultCountMin cannot be greater than resultCountMax');
    }

    const limit = Math.min(Math.max(dto.limit ?? 50, 1), 200);
    const offset = Math.max(dto.offset ?? 0, 0);

    const hasDateFilter = Boolean(dto.createdFrom || dto.createdTo);
    const runDate = this.getLocalDateString();
    const createdFrom = hasDateFilter ? dto.createdFrom : `${runDate}T00:01:00.000Z`;
    const createdTo = hasDateFilter ? dto.createdTo : `${runDate}T23:59:59.999Z`;
    const scheduledDates = this.buildScheduledDates(createdFrom, createdTo);

    const items = await this.listJobs({
      statuses: dto.statuses,
      states: dto.states,
      scheduledDates,
      createdFrom,
      createdTo,
      searchQuery: dto.searchQuery,
      resultCountMin: dto.resultCountMin,
      resultCountMax: dto.resultCountMax,
    });

    const mapped = items.map((item) => this.mapJobItem(item));

    const totalRecords = mapped.length;
    const totalPages = totalRecords > 0 ? Math.max(1, Math.ceil(totalRecords / limit)) : 1;
    const currentPage = Math.floor(offset / limit) + 1;
    const paged = mapped.slice(offset, offset + limit);

    return {
      result: paged,
      totalRecords,
      currentPage,
      totalPages,
      limit,
      offset,
    };
  }

  private async listJobsByScheduledDates(filters: ScrapeJobsListFilters): Promise<Array<Record<string, any>>> {
    const scheduledDates = filters.scheduledDates ?? [];
    if (scheduledDates.length === 0 || !this.scheduledDateIndexName) {
      return this.listJobs(filters);
    }

    const statusFilter = this.buildInFilter(filters.statuses, 'status');
    const normalizedStates = filters.states?.map((state) => state.toUpperCase());
    const useStateKey = normalizedStates && normalizedStates.length === 1;
    const stateFilter = useStateKey ? undefined : this.buildInFilter(normalizedStates, 'state');

    // Build filter parts for DynamoDB (move filtering from JS to DynamoDB)
    const filterParts: string[] = [];
    const filterValues: Record<string, AttributeValue> = {};

    if (statusFilter.expression) {
      filterParts.push(statusFilter.expression);
      Object.assign(filterValues, statusFilter.values);
    }
    if (stateFilter?.expression) {
      filterParts.push(stateFilter.expression);
      Object.assign(filterValues, stateFilter.values);
    }

    // Move createdAt filter to DynamoDB
    if (filters.createdFrom && filters.createdTo) {
      filterParts.push('#createdAt BETWEEN :createdFrom AND :createdTo');
      filterValues[':createdFrom'] = { S: filters.createdFrom };
      filterValues[':createdTo'] = { S: filters.createdTo };
    } else if (filters.createdFrom) {
      filterParts.push('#createdAt >= :createdFrom');
      filterValues[':createdFrom'] = { S: filters.createdFrom };
    } else if (filters.createdTo) {
      filterParts.push('#createdAt <= :createdTo');
      filterValues[':createdTo'] = { S: filters.createdTo };
    }

    // Move resultCount filter to DynamoDB
    if (filters.resultCountMin !== undefined && filters.resultCountMax !== undefined) {
      filterParts.push('#resultCount BETWEEN :resultCountMin AND :resultCountMax');
      filterValues[':resultCountMin'] = { N: String(filters.resultCountMin) };
      filterValues[':resultCountMax'] = { N: String(filters.resultCountMax) };
    } else if (filters.resultCountMin !== undefined) {
      filterParts.push('#resultCount >= :resultCountMin');
      filterValues[':resultCountMin'] = { N: String(filters.resultCountMin) };
    } else if (filters.resultCountMax !== undefined) {
      filterParts.push('#resultCount <= :resultCountMax');
      filterValues[':resultCountMax'] = { N: String(filters.resultCountMax) };
    }

    // Move searchQuery filter to DynamoDB
    if (filters.searchQuery) {
      filterParts.push('contains(#stateSegmentRunKey, :searchQuery)');
      filterValues[':searchQuery'] = { S: filters.searchQuery.toUpperCase() };
    }

    const expressionAttributeNames: Record<string, string> = {
      '#scheduledDate': 'scheduledDate',
      '#jobId': 'jobId',
      '#state': 'state',
      '#segmentIndex': 'segmentIndex',
      '#segmentCount': 'segmentCount',
      '#status': 'status',
      '#stateSegmentRunKey': 'stateSegmentRunKey',
      '#failCount': 'failCount',
      '#resultCount': 'resultCount',
      '#newCount': 'newCount',
      '#changedCount': 'changedCount',
      '#unchangedCount': 'unchangedCount',
      '#zillowLink': 'zillow_link',
      '#createdAt': 'createdAt',
    };

    const projectionExpression = [
      '#jobId',
      '#createdAt',
      '#state',
      '#segmentIndex',
      '#segmentCount',
      '#status',
      '#stateSegmentRunKey',
      '#failCount',
      '#resultCount',
      '#newCount',
      '#changedCount',
      '#unchangedCount',
      '#zillowLink',
    ].join(', ');

    const filterExpression = filterParts.length > 0 ? filterParts.join(' AND ') : undefined;
    const keyConditionExpression = useStateKey
      ? '#scheduledDate = :scheduledDate AND #state = :state'
      : '#scheduledDate = :scheduledDate';

    // PARALLEL queries for all dates instead of sequential
    const queryPromises = scheduledDates.map((scheduledDate) =>
      this.queryDatePartition(
        scheduledDate,
        keyConditionExpression,
        filterExpression,
        projectionExpression,
        expressionAttributeNames,
        {
          ':scheduledDate': { S: scheduledDate },
          ...filterValues,
          ...(useStateKey && normalizedStates ? { ':state': { S: normalizedStates[0] } } : {}),
        },
      ),
    );

    const results = await Promise.all(queryPromises);
    return results.flat();
  }

  private async queryDatePartition(
    scheduledDate: string,
    keyConditionExpression: string,
    filterExpression: string | undefined,
    projectionExpression: string,
    expressionAttributeNames: Record<string, string>,
    expressionAttributeValues: Record<string, AttributeValue>,
  ): Promise<Array<Record<string, any>>> {
    const out: Array<Record<string, any>> = [];
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined;

    do {
      const result = await this.dynamo.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: this.scheduledDateIndexName,
          KeyConditionExpression: keyConditionExpression,
          FilterExpression: filterExpression,
          ProjectionExpression: projectionExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      );

      out.push(...(result.Items ?? []).map((item) => unmarshall(item)));
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return out;
  }

  private buildInFilter(values: string[] | undefined, attribute: string): {
    expression?: string;
    values: Record<string, AttributeValue>;
  } {
    if (!values || values.length === 0) return { expression: undefined, values: {} };
    const expressionValues: Record<string, AttributeValue> = {};
    const tokens = values.map((value, idx) => {
      const key = `:${attribute}${idx}`;
      expressionValues[key] = { S: value };
      return key;
    });
    return {
      expression: `#${attribute} IN (${tokens.join(', ')})`,
      values: expressionValues,
    };
  }

  private combineFilters(parts: Array<string | undefined>): string | undefined {
    const filtered = parts.filter(Boolean) as string[];
    return filtered.length > 0 ? filtered.join(' AND ') : undefined;
  }

  private initializeStateSummaries(): Map<StatesAbbreviation, ScrapeRunStateSummary> {
    const summaries = new Map<StatesAbbreviation, ScrapeRunStateSummary>();
    for (const state of Object.values(StatesAbbreviation)) {
      summaries.set(state, {
        state,
        totalJobs: 0,
        pending: 0,
        running: 0,
        success: 0,
        failed: 0,
        retrying: 0,
        changedCount: 0,
        newCount: 0,
        changedAndNewCount: 0,
        remaining: 0,
      });
    }
    return summaries;
  }

  private async queryJobsByRunDate(runDate: string): Promise<Array<Record<string, any>>> {
    const out: Array<Record<string, any>> = [];
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
    const expressionAttributeNames = {
      '#scheduledDate': 'scheduledDate',
      '#state': 'state',
      '#status': 'status',
      '#changedCount': 'changedCount',
      '#newCount': 'newCount',
    };
    const expressionAttributeValues = { ':runDate': { S: runDate } };
    const projectionExpression = '#state, #status, #changedCount, #newCount';

    if (!this.scheduledDateIndexName) {
      return this.scanJobsByRunDate(runDate);
    }

    do {
      try {
        const result = await this.dynamo.send(
          new QueryCommand({
            TableName: this.tableName,
            IndexName: this.scheduledDateIndexName,
            KeyConditionExpression: '#scheduledDate = :runDate',
            ProjectionExpression: projectionExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ExclusiveStartKey: lastEvaluatedKey,
          }),
        );

        out.push(...(result.Items ?? []).map((item) => unmarshall(item)));
        lastEvaluatedKey = result.LastEvaluatedKey;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Dynamo scrape_jobs query failed (index ${this.scheduledDateIndexName}); falling back to scan: ${message}`,
        );
        return this.scanJobsByRunDate(runDate);
      }
    } while (lastEvaluatedKey);

    return out;
  }

  private async scanJobsByRunDate(runDate: string): Promise<Array<Record<string, any>>> {
    const out: Array<Record<string, any>> = [];
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined;

    const expressionAttributeNames = {
      '#scheduledDate': 'scheduledDate',
      '#state': 'state',
      '#status': 'status',
      '#changedCount': 'changedCount',
      '#newCount': 'newCount',
    };
    const expressionAttributeValues = { ':runDate': { S: runDate } };
    const projectionExpression = '#state, #status, #changedCount, #newCount';

    do {
      try {
        const result = await this.dynamo.send(
          new ScanCommand({
            TableName: this.tableName,
            FilterExpression: '#scheduledDate = :runDate',
            ProjectionExpression: projectionExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ExclusiveStartKey: lastEvaluatedKey,
          }),
        );

        out.push(...(result.Items ?? []).map((item) => unmarshall(item)));
        lastEvaluatedKey = result.LastEvaluatedKey;
      } catch (err) {
        this.logger.error(`Dynamo scrape_jobs scan failed: ${err}`);
        throw err;
      }
    } while (lastEvaluatedKey);

    return out;
  }

  private mapJobItem(item: Record<string, any>): ScrapeJobItemDto {
    return {
      jobId: String(item.jobId ?? ''),
      createdAt: String(item.createdAt ?? ''),
      state: String(item.state ?? '').toUpperCase() as StatesAbbreviation,
      segmentIndex: this.toNumber(item.segmentIndex),
      segmentCount: this.toNumber(item.segmentCount),
      status: String(item.status ?? '').toUpperCase() as ScrapeJobStatus,
      stateSegmentRunKey: String(item.stateSegmentRunKey ?? ''),
      failedCount: this.toNumber(item.failCount),
      resultCount: this.toNumber(item.resultCount),
      newCount: this.toNumber(item.newCount),
      changedCount: this.toNumber(item.changedCount),
      unchangedCount: this.toNumber(item.unchangedCount),
      zillowLink: String(item.zillow_link ?? item.zillowLink ?? ''),
    };
  }

  private toNumber(value: unknown): number {
    if (value === undefined || value === null || value === '') return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private getLocalDateString(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private buildScheduledDates(createdFrom?: string, createdTo?: string): string[] | undefined {
    if (!createdFrom && !createdTo) return undefined;
    const fromDate = createdFrom ? new Date(createdFrom) : createdTo ? new Date(createdTo) : undefined;
    const toDate = createdTo ? new Date(createdTo) : createdFrom ? new Date(createdFrom) : undefined;
    if (!fromDate || !toDate || Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return undefined;
    }

    const start = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth(), fromDate.getUTCDate()));
    const end = new Date(Date.UTC(toDate.getUTCFullYear(), toDate.getUTCMonth(), toDate.getUTCDate()));
    const dates: string[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      dates.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return dates;
  }
}
