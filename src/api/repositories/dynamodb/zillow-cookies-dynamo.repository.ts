import {
  BatchWriteItemCommand,
  DynamoDBClient,
  ScanCommand,
  UpdateItemCommand,
} from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ZillowCookieItemDto } from '../../admin/scraper/dto/zillow-cookie-item.dto';
import { ZillowCookiesListQueryDto } from '../../admin/scraper/dto/zillow-cookies-list-query.dto';
import { ZillowCookiesListResponseDto } from '../../admin/scraper/dto/zillow-cookies-list-response.dto';
import { ZillowCookiesBulkSetActiveDto } from '../../admin/scraper/dto/zillow-cookies-bulk-set-active.dto';
import { ZillowCookiesBulkActionResponseDto } from '../../admin/scraper/dto/zillow-cookies-bulk-action-response.dto';
import { ZillowCookiesCreateDto } from '../../admin/scraper/dto/zillow-cookies-create.dto';
import { ZillowCookiesCreateResponseDto } from '../../admin/scraper/dto/zillow-cookies-create-response.dto';

@Injectable()
export class ZillowCookiesDynamoRepository {
  private readonly logger = new Logger(ZillowCookiesDynamoRepository.name);
  private readonly tableName: string;

  constructor(private readonly dynamo: DynamoDBClient) {
    this.tableName = process.env.ZILLOW_COOKIES_TABLE || 'zillow_cookies';
  }

  async listCookies(dto: ZillowCookiesListQueryDto): Promise<ZillowCookiesListResponseDto> {
    const limit = Math.min(Math.max(dto.limit ?? 50, 1), 200);
    const offset = Math.max(dto.offset ?? 0, 0);

    const items = await this.scanAllCookies();
    const mapped = items.map((item) => this.mapCookieItem(item)).sort((a, b) => a.cookieId.localeCompare(b.cookieId));

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

  async setCookiesActive(dto: ZillowCookiesBulkSetActiveDto): Promise<ZillowCookiesBulkActionResponseDto> {
    const cookieIds = Array.from(new Set(dto.cookieIds ?? [])).filter(Boolean);
    if (cookieIds.length === 0) {
      throw new BadRequestException('cookieIds is required');
    }

    const processedIds: string[] = [];
    const skippedIds: string[] = [];

    for (const cookieId of cookieIds) {
      try {
        await this.dynamo.send(
          new UpdateItemCommand({
            TableName: this.tableName,
            Key: { cookieId: { S: cookieId } },
            UpdateExpression: 'SET isActive = :isActive',
            ConditionExpression: 'attribute_exists(cookieId)',
            ExpressionAttributeValues: {
              ':isActive': { BOOL: dto.isActive },
            },
          }),
        );
        processedIds.push(cookieId);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes('ConditionalCheckFailed')) {
          skippedIds.push(cookieId);
          continue;
        }
        this.logger.warn(`Failed to update cookie ${cookieId}: ${message}`);
        skippedIds.push(cookieId);
      }
    }

    return { processedIds, skippedIds };
  }

  async createCookies(dto: ZillowCookiesCreateDto): Promise<ZillowCookiesCreateResponseDto> {
    const values = dto.values ?? [];
    if (values.length === 0) {
      throw new BadRequestException('values is required');
    }

    const isActive = dto.isActive ?? true;
    const cookieIds = await this.generateCookieIds(values.length);

    const items = values.map((value, index) => ({
      cookieId: cookieIds[index],
      value,
      isActive,
      failCount: 0,
      successCount: 0,
    }));

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

    return {
      result: items.map((item) => this.mapCookieItem(item)),
      totalCreated: items.length,
    };
  }

  private async scanAllCookies(): Promise<Array<Record<string, any>>> {
    const out: Array<Record<string, any>> = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const result = await this.dynamo.send(
        new ScanCommand({
          TableName: this.tableName,
          ProjectionExpression: 'cookieId, #val, isActive, successCount, failCount, lastUsedAt',
          ExpressionAttributeNames: {
            '#val': 'value',
          },
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      );
      out.push(...(result.Items ?? []).map((item) => unmarshall(item)));
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return out;
  }

  private mapCookieItem(item: Record<string, any>): ZillowCookieItemDto {
    return {
      cookieId: String(item.cookieId ?? ''),
      value: String(item.value ?? ''),
      isActive: Boolean(item.isActive ?? false),
      successCount: this.toNumber(item.successCount),
      failCount: this.toNumber(item.failCount),
      lastUsedAt: item.lastUsedAt ? String(item.lastUsedAt) : undefined,
    };
  }

  private toNumber(value: unknown): number {
    if (value === undefined || value === null || value === '') return 0;
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  private async generateCookieIds(count: number): Promise<string[]> {
    const existing = await this.scanAllCookieIds();
    let max = 0;
    for (const id of existing) {
      const match = /^cookie_(\d+)$/.exec(id);
      if (!match) continue;
      const num = Number(match[1]);
      if (Number.isFinite(num)) {
        max = Math.max(max, num);
      }
    }

    const ids: string[] = [];
    let next = max + 1;
    while (ids.length < count) {
      const candidate = `cookie_${next.toString().padStart(4, '0')}`;
      ids.push(candidate);
      next += 1;
    }

    return ids;
  }

  private async scanAllCookieIds(): Promise<string[]> {
    const out: string[] = [];
    let lastEvaluatedKey: Record<string, any> | undefined;

    do {
      const result = await this.dynamo.send(
        new ScanCommand({
          TableName: this.tableName,
          ProjectionExpression: 'cookieId',
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      );
      for (const item of result.Items ?? []) {
        const record = unmarshall(item);
        if (record.cookieId) out.push(String(record.cookieId));
      }
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return out;
  }
}
