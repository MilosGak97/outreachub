import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { WorkerRunStatus } from '../../../../enums/worker/worker-run-status.enum';
import { WorkerType } from '../../../../enums/worker/worker-type.enum';
import { StatesAbbreviation } from '../../../../enums/common/states-abbreviation.enum';

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

export class WorkerRunListQueryDto {
  @ApiPropertyOptional({ description: 'Filter by worker types', enum: WorkerType, enumName: 'WorkerType', isArray: true })
  @Transform(({ value }) => toArray(value), { toClassOnly: true })
  @IsOptional()
  @IsArray()
  @IsEnum(WorkerType, { each: true })
  workerTypes?: WorkerType[];

  @ApiPropertyOptional({ description: 'Filter by statuses', enum: WorkerRunStatus, enumName: 'WorkerRunStatus', isArray: true })
  @Transform(({ value }) => toArray(value), { toClassOnly: true })
  @IsOptional()
  @IsArray()
  @IsEnum(WorkerRunStatus, { each: true })
  statuses?: WorkerRunStatus[];

  @ApiPropertyOptional({ description: 'Filter by states', enum: StatesAbbreviation, enumName: 'StatesAbbreviation', isArray: true })
  @Transform(({ value }) => toArray(value)?.map((v) => v.toUpperCase()), { toClassOnly: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  states?: string[];

  @ApiPropertyOptional({ description: 'Filter by run date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  runDate?: string;

  @ApiPropertyOptional({ description: 'Limit', default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Offset', default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
