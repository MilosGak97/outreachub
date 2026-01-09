import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WorkerRunStatus } from '../../../../enums/worker/worker-run-status.enum';
import { WorkerType } from '../../../../enums/worker/worker-type.enum';

export class WorkerRunItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: WorkerType, enumName: 'WorkerType' })
  workerType: WorkerType;

  @ApiPropertyOptional()
  state?: string;

  @ApiPropertyOptional()
  runDate?: string;

  @ApiProperty({ enum: WorkerRunStatus, enumName: 'WorkerRunStatus' })
  status: WorkerRunStatus;

  @ApiProperty()
  @Type(() => Number)
  priority: number;

  @ApiProperty()
  @Type(() => Number)
  attempts: number;

  @ApiProperty()
  @Type(() => Number)
  maxAttempts: number;

  @ApiPropertyOptional()
  awsTaskArn?: string;

  @ApiPropertyOptional()
  error?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  startedAt?: Date;

  @ApiPropertyOptional()
  @Type(() => Date)
  finishedAt?: Date;

  @ApiProperty()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty()
  @Type(() => Date)
  updatedAt: Date;
}
