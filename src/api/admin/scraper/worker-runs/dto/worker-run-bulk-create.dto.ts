import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsObject, IsOptional, Min } from 'class-validator';
import { StatesAbbreviation } from '../../../../enums/common/states-abbreviation.enum';
import { WorkerType } from '../../../../enums/worker/worker-type.enum';

const toStringArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  const rawValues = Array.isArray(value) ? value : value.toString().split(',');
  const normalized = rawValues
    .map((v) => (v ?? '').toString().trim())
    .filter(Boolean);
  return normalized.length > 0 ? normalized : undefined;
};

const normalizeEnv = (value: unknown): Record<string, string> | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  let raw: unknown = value;
  if (typeof value === 'string') {
    try {
      raw = JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const entries = Object.entries(raw as Record<string, unknown>)
    .filter(([key]) => key.trim().length > 0)
    .map(([key, val]) => [key.trim(), val === undefined || val === null ? '' : String(val)]);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

/**
 * Request body for scheduling worker runs.
 *
 * @example
 * // Schedule IMPORT workers for specific states
 * {
 *   "workerType": "IMPORT",
 *   "states": ["CA", "TX", "FL"],
 *   "runDate": "2024-01-15",
 *   "priority": 10,
 *   "maxAttempts": 3
 * }
 *
 * @example
 * // Schedule ENRICH workers with custom environment
 * {
 *   "workerType": "ENRICH",
 *   "states": ["NY"],
 *   "env": {
 *     "BATCH_SIZE": "1000",
 *     "DRY_RUN": "false"
 *   }
 * }
 */
export class WorkerRunBulkCreateDto {
  @ApiProperty({
    description: `Type of worker to schedule.

| Worker | Purpose | Typical Duration |
|--------|---------|-----------------|
| \`IMPORT\` | DynamoDB → PostgreSQL | 5-15 min/state |
| \`ENRICH\` | Add demographics, market data | 10-30 min/state |
| \`MOSAIC\` | AI image analysis | 15-45 min/state |
| \`FILTER\` | Lead qualification rules | 5-20 min/state |`,
    enum: WorkerType,
    enumName: 'WorkerType',
    example: 'IMPORT',
  })
  @IsEnum(WorkerType)
  workerType: WorkerType;

  @ApiProperty({
    description: `US states to create worker runs for.

One WorkerRun record is created per state. Each runs as a separate ECS task.

**Format:** Array of 2-letter state abbreviations`,
    enum: StatesAbbreviation,
    enumName: 'StatesAbbreviation',
    isArray: true,
    example: ['CA', 'TX', 'FL'],
  })
  @Transform(({ value }) => toStringArray(value)?.map((v) => v.toUpperCase()), { toClassOnly: true })
  @IsArray()
  @IsEnum(StatesAbbreviation, { each: true })
  states: StatesAbbreviation[];

  @ApiPropertyOptional({
    description: `Target run date.

**Format:** \`YYYY-MM-DD\`

**Default:** Today's date

Workers use this to filter which records to process.`,
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  runDate?: string;

  @ApiPropertyOptional({
    description: `Dispatch priority (higher = dispatched first).

When multiple runs are QUEUED, higher priority runs start first.

**Recommended values:**
- \`0\`: Normal priority (default)
- \`10\`: High priority
- \`100\`: Urgent/emergency`,
    example: 10,
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priority?: number = 0;

  @ApiPropertyOptional({
    description: `Maximum retry attempts for failed runs.

If a run fails, it can be automatically retried up to this many times.

**Default:** 1 (no retries)

**Note:** Retries are not automatic - you need to implement retry logic or manually re-dispatch.`,
    example: 3,
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAttempts?: number = 1;

  @ApiPropertyOptional({
    description: `Custom environment variables passed to the ECS task.

Use this to override default worker behavior.

**Common overrides:**
- \`BATCH_SIZE\`: Number of records per batch
- \`DRY_RUN\`: Set to "true" for testing
- \`DEBUG\`: Enable verbose logging

**Format:** JSON object with string values`,
    type: 'object',
    example: {
      BATCH_SIZE: '1000',
      DRY_RUN: 'false',
    },
  })
  @IsOptional()
  @IsObject()
  @Transform(({ value }) => normalizeEnv(value), { toClassOnly: true })
  env?: Record<string, string>;
}
