import { Injectable } from '@nestjs/common';
import { DynamoDBClient, ScanCommand, AttributeValue } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

interface CountyItem {
  name?: string;
  state?: string;
}

@Injectable()
export class CountiesDynamoService {
  private readonly tableName: string;

  constructor(private readonly dynamo: DynamoDBClient) {
    this.tableName = process.env.COUNTIES_TABLE || 'counties';
  }

  async getCounties(search?: string, state?: string): Promise<string[]> {
    const entries = await this.scanCounties();
    const normalizedSearch = search?.toLowerCase();
    const normalizedState = state?.toUpperCase();

    const filtered = entries.filter((entry) => {
      const name = entry.name?.trim();
      const itemState = entry.state?.trim();
      if (!name || !itemState) {
        return false;
      }

      const matchesSearch =
        !normalizedSearch || name.toLowerCase().includes(normalizedSearch);
      const matchesState =
        !normalizedState || itemState.toUpperCase() === normalizedState;
      return matchesSearch && matchesState;
    });

    const sorted = filtered.sort((a, b) => a.name.localeCompare(b.name));
    return sorted.map((entry) => `${entry.name}, ${entry.state}`);
  }

  private async scanCounties(): Promise<CountyItem[]> {
    const results: CountyItem[] = [];
    let exclusiveStartKey: Record<string, AttributeValue> | undefined;

    do {
      const command = new ScanCommand({
        TableName: this.tableName,
        ProjectionExpression: '#name, #state',
        ExpressionAttributeNames: {
          '#name': 'name',
          '#state': 'state',
        },
        ExclusiveStartKey: exclusiveStartKey,
      });

      const response = await this.dynamo.send(command);
      const items = response.Items?.map((item) => unmarshall(item) as CountyItem);
      if (items) {
        results.push(...items);
      }
      exclusiveStartKey = response.LastEvaluatedKey;
    } while (exclusiveStartKey);

    return results;
  }
}
