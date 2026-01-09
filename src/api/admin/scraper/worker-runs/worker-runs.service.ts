import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  DescribeTasksCommand,
  ECSClient,
  RunTaskCommand,
  RunTaskCommandInput,
  StopTaskCommand,
} from '@aws-sdk/client-ecs';
import { In } from 'typeorm';
import { WorkerRunRepository } from '../../../repositories/postgres/worker/worker-run.repository';
import { WorkerRunBulkCreateDto } from './dto/worker-run-bulk-create.dto';
import { WorkerRunBulkCreateResponseDto } from './dto/worker-run-bulk-create-response.dto';
import { WorkerRunBulkIdsDto } from './dto/worker-run-bulk-ids.dto';
import { WorkerRunBulkActionResponseDto } from './dto/worker-run-bulk-action-response.dto';
import { WorkerRunListQueryDto } from './dto/worker-run-list-query.dto';
import { WorkerRunListResponseDto } from './dto/worker-run-list-response.dto';
import { WorkerRunItemDto } from './dto/worker-run-item.dto';
import { WorkerRunStatus } from '../../../enums/worker/worker-run-status.enum';
import { WorkerType } from '../../../enums/worker/worker-type.enum';
import { WorkerRun } from '../../../entities/worker/worker-run.entity';

@Injectable()
export class WorkerRunsService {
  private readonly logger = new Logger(WorkerRunsService.name);
  private dispatchInProgress = false;
  private pollInProgress = false;

  constructor(
    private readonly workerRunRepo: WorkerRunRepository,
    private readonly ecs: ECSClient,
  ) {}

  async createRuns(dto: WorkerRunBulkCreateDto, createdBy?: string): Promise<WorkerRunBulkCreateResponseDto> {
    const runDate = this.normalizeRunDate(dto.runDate);
    const states = Array.from(new Set(dto.states.map((s) => s.toUpperCase())));
    const maxAttempts = dto.maxAttempts ?? 1;
    const priority = dto.priority ?? 0;

    const existing = await this.workerRunRepo.find({
      where: {
        workerType: dto.workerType,
        runDate,
        state: In(states),
        status: In([WorkerRunStatus.QUEUED, WorkerRunStatus.RUNNING]),
      },
    });
    const existingStates = new Set(existing.map((run) => run.state));
    const toCreate = states.filter((state) => !existingStates.has(state));

    const rows = toCreate.map((state) =>
      this.workerRunRepo.create({
        workerType: dto.workerType,
        state,
        runDate,
        status: WorkerRunStatus.QUEUED,
        priority,
        attempts: 0,
        maxAttempts,
        env: dto.env,
        createdBy,
      }),
    );

    const created = rows.length > 0 ? await this.workerRunRepo.save(rows) : [];

    return {
      created: created.map((run) => this.toItemDto(run)),
      skippedStates: states.filter((state) => existingStates.has(state)),
    };
  }

  async listRuns(dto: WorkerRunListQueryDto): Promise<WorkerRunListResponseDto> {
    const limit = Math.min(Math.max(dto.limit ?? 50, 1), 200);
    const offset = Math.max(dto.offset ?? 0, 0);
    const runDate = dto.runDate ? this.normalizeRunDate(dto.runDate) : undefined;

    const { records, total } = await this.workerRunRepo.findPaged(
      {
        statuses: dto.statuses,
        workerTypes: dto.workerTypes,
        states: dto.states?.map((s) => s.toUpperCase()),
        runDate,
      },
      limit,
      offset,
    );

    const totalPages = total > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      records: records.map((run) => this.toItemDto(run)),
      totalRecords: total,
      totalPages,
      currentPage,
      limit,
      offset,
    };
  }

  async stopRuns(dto: WorkerRunBulkIdsDto): Promise<WorkerRunBulkActionResponseDto> {
    const ids = Array.from(new Set(dto.ids ?? []));
    if (ids.length === 0) {
      throw new BadRequestException('No worker run ids provided');
    }

    const runs = await this.workerRunRepo.findBy({ id: In(ids) });
    const cluster = this.getClusterName();
    const stoppedIds: string[] = [];
    const skippedIds: string[] = [];

    for (const run of runs) {
      if (run.status !== WorkerRunStatus.RUNNING || !run.awsTaskArn) {
        skippedIds.push(run.id);
        continue;
      }
      try {
        await this.ecs.send(
          new StopTaskCommand({
            cluster,
            task: run.awsTaskArn,
            reason: 'Stopped by admin',
          }),
        );
        await this.workerRunRepo.update(run.id, {
          status: WorkerRunStatus.STOPPED,
          finishedAt: new Date(),
          error: 'Stopped by admin',
        });
        stoppedIds.push(run.id);
      } catch (err) {
        this.logger.error(`Failed to stop worker run ${run.id}: ${err instanceof Error ? err.message : String(err)}`);
        skippedIds.push(run.id);
      }
    }

    const missingIds = ids.filter((id) => !runs.some((run) => run.id === id));
    skippedIds.push(...missingIds);

    return { processedIds: stoppedIds, skippedIds };
  }

  async deleteRuns(dto: WorkerRunBulkIdsDto): Promise<WorkerRunBulkActionResponseDto> {
    const ids = Array.from(new Set(dto.ids ?? []));
    if (ids.length === 0) {
      throw new BadRequestException('No worker run ids provided');
    }

    const runs = await this.workerRunRepo.findBy({ id: In(ids) });
    const deletable = runs.filter((run) => run.status !== WorkerRunStatus.RUNNING);
    const deletableIds = deletable.map((run) => run.id);
    const skippedIds = ids.filter((id) => !deletableIds.includes(id));

    if (deletableIds.length > 0) {
      await this.workerRunRepo.delete({ id: In(deletableIds) });
    }

    return { processedIds: deletableIds, skippedIds };
  }

  async dispatchQueuedRuns(): Promise<WorkerRunBulkActionResponseDto> {
    const startedIds: string[] = [];
    const skippedIds: string[] = [];

    for (const workerType of Object.values(WorkerType)) {
      const maxConcurrent = this.getMaxConcurrent(workerType);
      if (maxConcurrent <= 0) continue;
      const runningCount = await this.workerRunRepo.countRunningByType(workerType);
      const availableSlots = Math.max(0, maxConcurrent - runningCount);
      if (availableSlots === 0) continue;

      const dispatchBatch = this.getDispatchBatchSize();
      const take = Math.min(availableSlots, dispatchBatch);
      const queued = await this.workerRunRepo.findQueuedByType(workerType, take);

      for (const run of queued) {
        try {
          const taskArn = await this.startRunTask(run);
          if (!taskArn) {
            await this.workerRunRepo.update(run.id, {
              status: WorkerRunStatus.FAILED,
              error: 'RunTask returned no task ARN',
              finishedAt: new Date(),
            });
            skippedIds.push(run.id);
            continue;
          }
          await this.workerRunRepo.update(run.id, {
            status: WorkerRunStatus.RUNNING,
            awsTaskArn: taskArn,
            startedAt: new Date(),
            attempts: run.attempts + 1,
            error: null,
          });
          startedIds.push(run.id);
        } catch (err) {
          await this.workerRunRepo.update(run.id, {
            status: WorkerRunStatus.FAILED,
            error: err instanceof Error ? err.message : String(err),
            finishedAt: new Date(),
            attempts: run.attempts + 1,
          });
          skippedIds.push(run.id);
        }
      }
    }

    return { processedIds: startedIds, skippedIds };
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async dispatchQueuedRunsCron(): Promise<void> {
    if (this.dispatchInProgress) return;
    this.dispatchInProgress = true;
    try {
      await this.dispatchQueuedRuns();
    } catch (err) {
      this.logger.error(`worker run dispatch failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.dispatchInProgress = false;
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async pollRunningRunsCron(): Promise<void> {
    if (this.pollInProgress) return;
    this.pollInProgress = true;
    try {
      await this.pollRunningRuns();
    } catch (err) {
      this.logger.error(`worker run polling failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      this.pollInProgress = false;
    }
  }

  private async pollRunningRuns(): Promise<void> {
    const runs = await this.workerRunRepo.find({
      where: { status: WorkerRunStatus.RUNNING },
    });
    const runsWithArn = runs.filter((run) => !!run.awsTaskArn);
    if (runsWithArn.length === 0) return;

    const cluster = this.getClusterName();
    const chunks = this.chunk(runsWithArn, 100);

    for (const chunk of chunks) {
      const taskArns = chunk.map((run) => run.awsTaskArn as string);
      const result = await this.ecs.send(
        new DescribeTasksCommand({
          cluster,
          tasks: taskArns,
        }),
      );

      const tasks = result.tasks ?? [];
      const tasksByArn = new Map(tasks.map((task) => [task.taskArn || '', task]));

      for (const run of chunk) {
        const task = run.awsTaskArn ? tasksByArn.get(run.awsTaskArn) : undefined;
        if (!task) {
          await this.workerRunRepo.update(run.id, {
            status: WorkerRunStatus.FAILED,
            error: 'ECS task not found',
            finishedAt: new Date(),
          });
          continue;
        }

        if (task.lastStatus !== 'STOPPED') {
          continue;
        }

        const containers = task.containers ?? [];
        const exitCodes = containers.map((c) => c.exitCode).filter((c) => c !== undefined);
        const hasFailure = exitCodes.some((code) => code !== 0);
        const stoppedReason = task.stoppedReason || containers.find((c) => c.reason)?.reason;

        await this.workerRunRepo.update(run.id, {
          status: hasFailure ? WorkerRunStatus.FAILED : WorkerRunStatus.COMPLETED,
          error: hasFailure ? stoppedReason || 'Task failed' : null,
          finishedAt: new Date(),
        });
      }
    }
  }

  private async startRunTask(run: WorkerRun): Promise<string | undefined> {
    const cluster = this.getClusterName();
    const taskDefinition = this.getTaskDefinition(run.workerType);
    const containerName = this.getContainerName(run.workerType);
    const networkConfiguration = this.getNetworkConfiguration();

    const env = this.buildEnv(run);
    const environment = Object.entries(env).map(([name, value]) => ({ name, value }));

    const result = await this.ecs.send(
      new RunTaskCommand({
        cluster,
        taskDefinition,
        launchType: this.getLaunchType(),
        networkConfiguration,
        overrides: {
          containerOverrides: [
            {
              name: containerName,
              environment,
            },
          ],
        },
      }),
    );

    const failure = result.failures?.[0];
    if (failure) {
      throw new Error(`${failure.arn || 'RunTask failure'}: ${failure.reason || 'Unknown'}`);
    }

    return result.tasks?.[0]?.taskArn;
  }

  private buildEnv(run: WorkerRun): Record<string, string> {
    const base: Record<string, string> = {
      WORKER_RUN_ID: run.id,
      WORKER_TYPE: run.workerType,
    };
    if (run.state) {
      base.STATE = run.state;
    }
    if (run.runDate) {
      base.RUN_DATE = run.runDate;
    }

    return { ...base, ...(run.env || {}) };
  }

  private normalizeRunDate(value?: string): string {
    if (!value) return this.getLocalDateString();
    const trimmed = value.trim();
    if (trimmed.length >= 10) {
      return trimmed.slice(0, 10);
    }
    return trimmed;
  }

  private getLocalDateString(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private getClusterName(): string {
    const cluster = process.env.WORKER_ECS_CLUSTER;
    if (!cluster) {
      throw new Error('WORKER_ECS_CLUSTER is not configured');
    }
    return cluster;
  }

  private getTaskDefinition(workerType: WorkerType): string {
    const key = `WORKER_ECS_TASK_DEFINITION_${workerType}`;
    const taskDefinition = process.env[key] || process.env.WORKER_ECS_TASK_DEFINITION;
    if (!taskDefinition) {
      throw new Error(`${key} is not configured`);
    }
    return taskDefinition;
  }

  private getContainerName(workerType: WorkerType): string {
    const key = `WORKER_ECS_CONTAINER_NAME_${workerType}`;
    const containerName = process.env[key] || process.env.WORKER_ECS_CONTAINER_NAME;
    if (!containerName) {
      throw new Error(`${key} is not configured`);
    }
    return containerName;
  }

  private getLaunchType(): 'FARGATE' | 'EC2' {
    const raw = (process.env.WORKER_ECS_LAUNCH_TYPE || 'FARGATE').toUpperCase();
    return raw === 'EC2' ? 'EC2' : 'FARGATE';
  }

  private getNetworkConfiguration(): RunTaskCommandInput['networkConfiguration'] {
    const subnetsRaw = process.env.WORKER_ECS_SUBNETS;
    const securityGroupsRaw = process.env.WORKER_ECS_SECURITY_GROUPS;
    if (!subnetsRaw || !securityGroupsRaw) {
      throw new Error('WORKER_ECS_SUBNETS and WORKER_ECS_SECURITY_GROUPS are required');
    }
    const subnets = subnetsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    const securityGroups = securityGroupsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    const assignPublicIp = (process.env.WORKER_ECS_ASSIGN_PUBLIC_IP || 'ENABLED').toUpperCase();

    return {
      awsvpcConfiguration: {
        subnets,
        securityGroups,
        assignPublicIp: assignPublicIp === 'DISABLED' ? 'DISABLED' : 'ENABLED',
      },
    };
  }

  private getMaxConcurrent(workerType: WorkerType): number {
    const key = `WORKER_RUN_MAX_CONCURRENCY_${workerType}`;
    const raw = process.env[key] || process.env.WORKER_RUN_MAX_CONCURRENCY || '1';
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 1;
  }

  private getDispatchBatchSize(): number {
    const raw = process.env.WORKER_RUN_DISPATCH_BATCH || '5';
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 5;
  }

  private toItemDto(run: WorkerRun): WorkerRunItemDto {
    return {
      id: run.id,
      workerType: run.workerType,
      state: run.state || undefined,
      runDate: run.runDate || undefined,
      status: run.status,
      priority: run.priority ?? 0,
      attempts: run.attempts ?? 0,
      maxAttempts: run.maxAttempts ?? 1,
      awsTaskArn: run.awsTaskArn || undefined,
      error: run.error || undefined,
      startedAt: run.startedAt,
      finishedAt: run.finishedAt,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
    };
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const out: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
      out.push(items.slice(i, i + size));
    }
    return out;
  }
}
