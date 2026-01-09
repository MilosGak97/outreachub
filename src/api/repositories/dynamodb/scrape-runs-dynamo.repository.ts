import { Injectable, Logger } from '@nestjs/common';
import { DynamoDBClient, GetItemCommand, PutItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

@Injectable()
export class ScrapeRunsDynamoRepository {
  private readonly logger = new Logger(ScrapeRunsDynamoRepository.name);
  private readonly tableName: string;

  constructor(private readonly dynamo: DynamoDBClient) {
    this.tableName = process.env.SCRAPE_RUNS_TABLE || 'scrape_runs';
  }

  async healthCheck(): Promise<{ region?: string; table: string; tableReachable: boolean; error?: string }> {
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
      this.logger.error(`Dynamo health check failed for ${this.tableName}: ${err}`);
      return {
        region,
        table: this.tableName,
        tableReachable: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  async getRunByStateRunId(stateRunId: string): Promise<Record<string, any> | null> {
    const normalized = (stateRunId || '').trim();
    if (!normalized) return null;

    const result = await this.dynamo.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: { stateRunId: { S: normalized }, sk: { S: 'RUN' } },
      }),
    );

    return result.Item ? (unmarshall(result.Item) as Record<string, any>) : null;
  }

  async createRun(item: Record<string, any>): Promise<void> {
    await this.dynamo.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall(item, { removeUndefinedValues: true }),
        ConditionExpression: 'attribute_not_exists(stateRunId)',
      }),
    );
  }

}
