import { Injectable, Logger } from '@nestjs/common';
import { AttributeValue, DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { StatesAbbreviation } from '../../enums/common/states-abbreviation.enum';

@Injectable()
export class PropertiesOutreachDynamoRepository {
  private readonly logger = new Logger(PropertiesOutreachDynamoRepository.name);
  private readonly tableName: string;
  private readonly stateField: string;
  private readonly outreachField: string;

  constructor(private readonly dynamo: DynamoDBClient) {
    this.tableName = process.env.PROPERTIES_ZILLOW_TABLE || 'properties_zillow';
    this.stateField = process.env.PROPERTIES_STATE_FIELD || 'state';
    this.outreachField = process.env.PROPERTIES_OUTREACH_FIELD || 'outreach';
  }

  async countOutreachRemainingByState(): Promise<Map<StatesAbbreviation, number>> {
    const counts = new Map<StatesAbbreviation, number>();
    const validStates = new Set(Object.values(StatesAbbreviation));
    for (const state of validStates) {
      counts.set(state, 0);
    }

    let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
    const expressionAttributeNames = {
      '#state': this.stateField,
      '#outreach': this.outreachField,
    };
    const expressionAttributeValues = {
      ':zeroNum': { N: '0' },
      ':zeroStr': { S: '0' },
      ':zeroBool': { BOOL: false },
    };
    const projectionExpression = '#state, #outreach';
    const filterExpression =
      '#outreach = :zeroNum OR #outreach = :zeroStr OR #outreach = :zeroBool';

    do {
      try {
        const result = await this.dynamo.send(
          new ScanCommand({
            TableName: this.tableName,
            ProjectionExpression: projectionExpression,
            FilterExpression: filterExpression,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ExclusiveStartKey: lastEvaluatedKey,
          }),
        );

        for (const item of result.Items ?? []) {
          const record = unmarshall(item);
          const stateValue = record[this.stateField];
          if (typeof stateValue !== 'string') continue;
          const normalized = stateValue.toUpperCase();
          if (!validStates.has(normalized as StatesAbbreviation)) continue;
          counts.set(
            normalized as StatesAbbreviation,
            (counts.get(normalized as StatesAbbreviation) ?? 0) + 1,
          );
        }

        lastEvaluatedKey = result.LastEvaluatedKey;
      } catch (err) {
        this.logger.error(
          `Dynamo properties scan failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        throw err;
      }
    } while (lastEvaluatedKey);

    return counts;
  }
}
