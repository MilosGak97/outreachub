import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { StatesAbbreviation } from '../../../enums/common/states-abbreviation.enum';

const toArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  const rawValues = Array.isArray(value) ? value : [value];
  const flattened: string[] = [];
  for (const raw of rawValues) {
    if (raw === undefined || raw === null) continue;
    if (Array.isArray(raw)) {
      flattened.push(...raw.map((v) => v.toString()));
      continue;
    }
    const asString = raw.toString();
    if (asString.includes(',')) {
      flattened.push(...asString.split(',').map((part) => part.trim()).filter(Boolean));
    } else if (asString.trim()) {
      flattened.push(asString.trim());
    }
  }
  return flattened.length > 0 ? flattened : undefined;
};

/**
 * Request body for scheduling scraping jobs.
 *
 * @example
 * // Schedule all states for today
 * {}
 *
 * @example
 * // Schedule specific states
 * {
 *   "states": ["CA", "TX", "FL"],
 *   "runDate": "2024-01-15"
 * }
 */
export class ScrapeScheduleStateConfigDto {
  @ApiPropertyOptional({
    description: `US states to schedule scraping jobs for.

**Behavior:**
- If omitted or empty: schedules ALL enabled states
- If provided: only schedules the specified states

**Format:** Array of 2-letter state abbreviations

**Note:** Only states with \`isPendingEnabled: true\` in state_config will actually create jobs.`,
    enum: StatesAbbreviation,
    enumName: 'StatesAbbreviation',
    isArray: true,
    example: ['CA', 'TX', 'FL'],
  })
  @Transform(({ value }) => toArray(value)?.map((v) => v.toUpperCase()), { toClassOnly: true })
  @IsOptional()
  @IsArray()
  @IsEnum(StatesAbbreviation, { each: true })
  states?: StatesAbbreviation[];

  @ApiPropertyOptional({
    description: `Target run date for the scheduled jobs.

**Format:** \`YYYY-MM-DD\`

**Default:** Today's date if omitted

**Use Cases:**
- Schedule for today: omit this field
- Schedule for future: set to future date
- Backfill: set to past date (use with caution)`,
    example: '2024-01-15',
  })
  @IsOptional()
  @IsDateString()
  runDate?: string;
}
