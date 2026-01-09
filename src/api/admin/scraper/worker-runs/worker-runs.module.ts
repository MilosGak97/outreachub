import { Module } from '@nestjs/common';
import { WorkerRunsController } from './worker-runs.controller';
import { WorkerRunsService } from './worker-runs.service';
import { WorkerRunRepository } from '../../../repositories/postgres/worker/worker-run.repository';

@Module({
  controllers: [WorkerRunsController],
  providers: [WorkerRunsService, WorkerRunRepository],
})
export class WorkerRunsModule {}
