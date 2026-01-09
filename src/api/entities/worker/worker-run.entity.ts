import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkerRunStatus } from '../../enums/worker/worker-run-status.enum';
import { WorkerType } from '../../enums/worker/worker-type.enum';

@Entity('worker-runs')
@Index('idx_worker_runs_status', ['status'])
@Index('idx_worker_runs_type', ['workerType'])
@Index('idx_worker_runs_state', ['state'])
@Index('idx_worker_runs_run_date', ['runDate'])
export class WorkerRun {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: WorkerType, enumName: 'WorkerType' })
  @IsEnum(WorkerType)
  @Column({ name: 'worker_type', type: 'enum', enum: WorkerType })
  workerType: WorkerType;

  @ApiPropertyOptional({ description: '2-letter state code' })
  @IsOptional()
  @IsString()
  @Column({ name: 'state', type: 'varchar', length: 2, nullable: true })
  state?: string;

  @ApiPropertyOptional({ description: 'Run date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  @Column({ name: 'run_date', type: 'date', nullable: true })
  runDate?: string;

  @ApiProperty({ enum: WorkerRunStatus, enumName: 'WorkerRunStatus' })
  @IsEnum(WorkerRunStatus)
  @Column({
    name: 'status',
    type: 'enum',
    enum: WorkerRunStatus,
    default: WorkerRunStatus.QUEUED,
  })
  status: WorkerRunStatus;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'priority', type: 'int', default: 0 })
  priority: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'attempts', type: 'int', default: 0 })
  attempts: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'max_attempts', type: 'int', default: 1 })
  maxAttempts: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Column({ name: 'aws_task_arn', type: 'text', nullable: true })
  awsTaskArn?: string;

  @ApiPropertyOptional({ description: 'Worker environment overrides' })
  @IsOptional()
  @Column({ name: 'env', type: 'jsonb', nullable: true })
  env?: Record<string, string>;

  @ApiPropertyOptional()
  @IsOptional()
  @Column({ name: 'error', type: 'text', nullable: true })
  error?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Column({ name: 'created_by', type: 'text', nullable: true })
  createdBy?: string;

  @ApiPropertyOptional()
  @Type(() => Date)
  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @ApiPropertyOptional()
  @Type(() => Date)
  @Column({ name: 'finished_at', type: 'timestamptz', nullable: true })
  finishedAt?: Date;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
