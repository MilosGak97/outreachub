import { Injectable, Logger } from '@nestjs/common';
import { AttributeValue, DynamoDBClient, GetItemCommand, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

@Injectable()
export class ScrapeStateConfigDynamoRepository {
  private readonly logger = new Logger(ScrapeStateConfigDynamoRepository.name);
  private readonly tableName: string;

  constructor(private readonly dynamo: DynamoDBClient) {
    this.tableName = process.env.STATE_CONFIG_TABLE || 'state_config';
  }

  async getStateConfig(state: string): Promise<Record<string, any> | null> {
    const normalizedState = (state || '').toUpperCase();
    if (!normalizedState) return null;

    try {
      const result = await this.dynamo.send(
        new GetItemCommand({
          TableName: this.tableName,
          Key: { state: { S: normalizedState } },
        }),
      );

      return result.Item ? (unmarshall(result.Item) as Record<string, any>) : null;
    } catch (err) {
      this.logger.error(`Dynamo state_config get failed for ${normalizedState}: ${err}`);
      throw err;
    }
  }

  async listStateConfigs(): Promise<Array<Record<string, any>>> {
    const out: Array<Record<string, any>> = [];
    let lastEvaluatedKey: Record<string, AttributeValue> | undefined;

    do {
      const result = await this.dynamo.send(
        new ScanCommand({
          TableName: this.tableName,
          ExclusiveStartKey: lastEvaluatedKey,
        }),
      );
      out.push(...(result.Items ?? []).map((item) => unmarshall(item)));
      lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return out;
  }
}
