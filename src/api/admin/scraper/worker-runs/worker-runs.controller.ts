import { Body, Controller, Delete, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminAuthGuard } from '../../auth/admin-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { AdminRole } from '../../../enums/admin/admin-role.enum';
import { WorkerRunsService } from './worker-runs.service';
import { WorkerRunBulkCreateDto } from './dto/worker-run-bulk-create.dto';
import { WorkerRunBulkCreateResponseDto } from './dto/worker-run-bulk-create-response.dto';
import { WorkerRunListQueryDto } from './dto/worker-run-list-query.dto';
import { WorkerRunListResponseDto } from './dto/worker-run-list-response.dto';
import { WorkerRunBulkIdsDto } from './dto/worker-run-bulk-ids.dto';
import { WorkerRunBulkActionResponseDto } from './dto/worker-run-bulk-action-response.dto';

/**
 * # Worker Runs Management
 *
 * Manages ECS Fargate tasks that execute pipeline stages (IMPORT, ENRICH, MOSAIC, FILTER).
 *
 * ## How Workers Work:
 * ```
 * 1. Schedule → Creates WorkerRun record (status: QUEUED)
 * 2. Dispatch → Cron picks up QUEUED runs, launches ECS tasks (status: RUNNING)
 * 3. Poll     → Cron checks ECS task status, updates record (status: COMPLETED/FAILED)
 * ```
 *
 * ## Worker Types:
 * | Type | Purpose |
 * |------|---------|
 * | IMPORT | Move data from DynamoDB to PostgreSQL |
 * | ENRICH | Add demographics, market data |
 * | MOSAIC | AI image analysis |
 * | FILTER | AI/rules-based lead qualification |
 *
 * ## Status Flow:
 * ```
 * QUEUED → RUNNING → COMPLETED
 *            ↓
 *         FAILED (can retry)
 *            ↓
 *         STOPPED (manual)
 * ```
 */
@ApiTags('scraper/workers')
@ApiBearerAuth()
@Controller('admin/scraper/workers')
@UseGuards(AdminAuthGuard, RolesGuard)
@Roles(AdminRole.HEAD)
export class WorkerRunsController {
  constructor(private readonly workerRunsService: WorkerRunsService) {}

  @ApiOperation({
    summary: 'Schedule worker runs',
    description: `Create new worker runs for specific states and worker type.

**How Scheduling Works:**
1. Creates WorkerRun records in PostgreSQL with status \`QUEUED\`
2. Background cron job picks up QUEUED runs every minute
3. Cron launches ECS Fargate tasks for each run
4. Run status changes to \`RUNNING\`

**Concurrency Control:**
- Each worker type has a max concurrency limit (env: \`WORKER_RUN_MAX_CONCURRENCY_{TYPE}\`)
- If limit reached, new runs stay QUEUED until slots free up

**Skipping Logic:**
- If a run already exists for same (workerType, state, runDate) with status QUEUED/RUNNING, it's skipped
- Prevents duplicate processing

**Request Options:**
- \`workerType\`: IMPORT, ENRICH, MOSAIC, or FILTER
- \`states\`: Array of state abbreviations to process
- \`runDate\`: Target date (default: today)
- \`priority\`: Higher priority runs dispatched first (default: 0)
- \`maxAttempts\`: Retry limit for failed runs (default: 1)
- \`env\`: Custom environment variables passed to ECS task
`,
  })
  @ApiBody({ type: WorkerRunBulkCreateDto })
  @ApiOkResponse({
    type: WorkerRunBulkCreateResponseDto,
    description: 'List of created runs and skipped states',
  })
  @ApiResponse({ status: 400, description: 'Invalid worker type or state' })
  @Post()
  async createRuns(
    @Body() body: WorkerRunBulkCreateDto,
    @Req() req: any,
  ): Promise<WorkerRunBulkCreateResponseDto> {
    return this.workerRunsService.createRuns(body, req?.user?.id);
  }

  @ApiOperation({
    summary: 'List worker runs',
    description: `Browse worker runs with filtering and pagination.

**Filters:**
- \`workerTypes\`: Filter by worker type (IMPORT, ENRICH, MOSAIC, FILTER)
- \`statuses\`: Filter by status (QUEUED, RUNNING, COMPLETED, FAILED, STOPPED)
- \`states\`: Filter by US states
- \`runDate\`: Filter by run date

**Response Includes:**
- \`id\`: Unique run identifier
- \`workerType\`: Type of worker
- \`state\`: US state being processed
- \`status\`: Current status
- \`awsTaskArn\`: ECS task ARN (when running)
- \`attempts\`: Number of execution attempts
- \`error\`: Error message (if failed)
- \`startedAt/finishedAt\`: Timing info
`,
  })
  @ApiOkResponse({
    type: WorkerRunListResponseDto,
    description: 'Paginated list of worker runs',
  })
  @Get()
  async listRuns(@Query() query: WorkerRunListQueryDto): Promise<WorkerRunListResponseDto> {
    return this.workerRunsService.listRuns(query);
  }

  @ApiOperation({
    summary: 'Stop worker runs',
    description: `Stop running ECS tasks for specified worker runs.

**What Happens:**
1. Sends StopTask command to ECS for each run
2. Updates run status to \`STOPPED\`
3. Sets error message to "Stopped by admin"

**Skipped Runs:**
- Runs not in \`RUNNING\` status are skipped
- Runs without \`awsTaskArn\` are skipped
- Non-existent run IDs are skipped

**Use Cases:**
- Stop runaway tasks consuming resources
- Cancel runs that are taking too long
- Emergency stop during incidents
`,
  })
  @ApiBody({ type: WorkerRunBulkIdsDto })
  @ApiOkResponse({
    type: WorkerRunBulkActionResponseDto,
    description: 'IDs of stopped and skipped runs',
  })
  @Post('stop')
  async stopRuns(@Body() body: WorkerRunBulkIdsDto): Promise<WorkerRunBulkActionResponseDto> {
    return this.workerRunsService.stopRuns(body);
  }

  @ApiOperation({
    summary: 'Delete worker runs',
    description: `Delete worker run records from the database.

**Restrictions:**
- Cannot delete runs with status \`RUNNING\` (stop them first)
- Deletes are permanent

**Skipped Runs:**
- Runs in \`RUNNING\` status
- Non-existent run IDs

**Use Cases:**
- Clean up old/completed runs
- Remove failed runs after investigation
- Maintenance cleanup
`,
  })
  @ApiBody({ type: WorkerRunBulkIdsDto })
  @ApiOkResponse({
    type: WorkerRunBulkActionResponseDto,
    description: 'IDs of deleted and skipped runs',
  })
  @Delete()
  async deleteRuns(@Body() body: WorkerRunBulkIdsDto): Promise<WorkerRunBulkActionResponseDto> {
    return this.workerRunsService.deleteRuns(body);
  }

  @ApiOperation({
    summary: 'Manually dispatch queued runs',
    description: `Trigger immediate dispatch of queued worker runs.

**Normal Flow:**
A background cron job runs every minute to dispatch QUEUED runs.

**Manual Dispatch:**
Use this endpoint to trigger dispatch immediately without waiting for cron.

**What Happens:**
1. For each worker type, checks available concurrency slots
2. Picks up QUEUED runs ordered by priority (desc) then createdAt (asc)
3. Launches ECS Fargate tasks
4. Updates run status to \`RUNNING\`

**Use Cases:**
- Immediately start newly scheduled runs
- Debug dispatch issues
- Speed up processing during off-peak hours
`,
  })
  @ApiOkResponse({
    type: WorkerRunBulkActionResponseDto,
    description: 'IDs of dispatched runs and failures',
  })
  @Post('dispatch')
  async dispatchRuns(): Promise<WorkerRunBulkActionResponseDto> {
    return this.workerRunsService.dispatchQueuedRuns();
  }
}
