import { Injectable, Logger } from '@nestjs/common';
import {
  DynamoDBClient,
  GetItemCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

@Injectable()
export class PropertiesDynamoService {
  private readonly logger = new Logger(PropertiesDynamoService.name);
  private readonly tableName: string;
  private readonly primaryKey: string;
  private readonly sortKey = 'snapshot';

  constructor(private readonly dynamo: DynamoDBClient) {
    this.tableName = process.env.PROPERTIES_ZILLOW_TABLE || 'properties_zillow';
    this.primaryKey = process.env.PROPERTIES_ZILLOW_PK || 'zpid';
  }

  get primaryKeyField(): string {
    return this.primaryKey;
  }

  get sortKeyField(): string {
    return this.sortKey;
  }

  /**
   * Convenience helper to fetch a single record by zpid (or configured PK).
   * Tries string and numeric PK representations to avoid schema mismatches.
   */
  async getByPrimaryKey(keyValue: string): Promise<Record<string, any> | null> {
    for (const pkVal of this.buildPkValueVariants(keyValue)) {
      try {
        const command = new GetItemCommand({
          TableName: this.tableName,
          Key: { [this.primaryKey]: pkVal },
        });

        const result = await this.dynamo.send(command);
        if (!result.Item) {
          return null;
        }
        return unmarshall(result.Item) as Record<string, any>;
      } catch (err) {
        if (this.isSchemaMismatchError(err)) {
          continue;
        }
        throw err;
      }
    }
    return null;
  }

  /**
   * Fetch the latest snapshot by PK using the sort key (descending).
   * Tries string and numeric PK representations to avoid schema mismatches.
   */
  async getLatestByPrimaryKey(keyValue: string): Promise<Record<string, any> | null> {
    for (const pkVal of this.buildPkValueVariants(keyValue)) {
      try {
        const command = new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: '#pk = :pkVal',
          ExpressionAttributeNames: { '#pk': this.primaryKey },
          ExpressionAttributeValues: { ':pkVal': pkVal },
          ScanIndexForward: false,
          Limit: 1,
        });

        const result = await this.dynamo.send(command);
        const first = result.Items?.[0];
        if (first) {
          return unmarshall(first) as Record<string, any>;
        }
      } catch (err) {
        if (this.isSchemaMismatchError(err)) {
          continue;
        }
        throw err;
      }
    }
    return null;
  }

  /**
   * Lightweight health check to verify connectivity and table access.
   */
  async healthCheck(): Promise<{
    region?: string;
    table: string;
    tableReachable: boolean;
    error?: string;
  }> {
    const region = await this.dynamo.config.region();
    try {
      await this.dynamo.send(
        new ScanCommand({
          TableName: this.tableName,
          Limit: 1,
        }),
      );
      return {
        region,
        table: this.tableName,
        tableReachable: true,
      };
    } catch (err) {
      this.logger.error(
        `Dynamo health check failed for ${this.tableName}: ${err}`,
      );
      return {
        region,
        table: this.tableName,
        tableReachable: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Accepts either a plain object (unmarshalled) or a raw AttributeValue map from Dynamo.
   * Passes through raw maps to avoid schema drift (needed for composite keys).
   */
  private buildPkValueVariants(keyValue: string): AttributeValue[] {
    const variants: AttributeValue[] = [{ S: keyValue }];
    const num = Number(keyValue);
    if (!Number.isNaN(num)) {
      variants.push({ N: keyValue.toString() });
    }
    return variants;
  }

  private isSchemaMismatchError(err: unknown): boolean {
    const msg = err instanceof Error ? err.message : String(err);
    return msg.toLowerCase().includes('key element does not match the schema');
  }
}
