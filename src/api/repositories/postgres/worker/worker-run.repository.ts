import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { WorkerRun } from '../../../entities/worker/worker-run.entity';
import { WorkerRunStatus } from '../../../enums/worker/worker-run-status.enum';
import { WorkerType } from '../../../enums/worker/worker-type.enum';

export type WorkerRunFilters = {
  statuses?: WorkerRunStatus[];
  workerTypes?: WorkerType[];
  states?: string[];
  runDate?: string;
};

@Injectable()
export class WorkerRunRepository extends Repository<WorkerRun> {
  constructor(private readonly dataSource: DataSource) {
    super(WorkerRun, dataSource.createEntityManager());
  }

  async findPaged(
    filters: WorkerRunFilters,
    limit: number,
    offset: number,
  ): Promise<{ records: WorkerRun[]; total: number }> {
    const qb = this.createQueryBuilder('wr');

    if (filters.statuses && filters.statuses.length > 0) {
      qb.andWhere('wr.status IN (:...statuses)', { statuses: filters.statuses });
    }
    if (filters.workerTypes && filters.workerTypes.length > 0) {
      qb.andWhere('wr.workerType IN (:...workerTypes)', { workerTypes: filters.workerTypes });
    }
    if (filters.states && filters.states.length > 0) {
      qb.andWhere('wr.state IN (:...states)', { states: filters.states });
    }
    if (filters.runDate) {
      qb.andWhere('wr.runDate = :runDate', { runDate: filters.runDate });
    }

    qb.orderBy('wr.createdAt', 'DESC');
    qb.skip(offset);
    qb.take(limit);

    const [records, total] = await qb.getManyAndCount();
    return { records, total };
  }

  async findQueuedByType(workerType: WorkerType, limit: number): Promise<WorkerRun[]> {
    return this.createQueryBuilder('wr')
      .where('wr.workerType = :workerType', { workerType })
      .andWhere('wr.status = :status', { status: WorkerRunStatus.QUEUED })
      .andWhere('wr.attempts < wr.maxAttempts')
      .orderBy('wr.priority', 'DESC')
      .addOrderBy('wr.createdAt', 'ASC')
      .take(limit)
      .getMany();
  }

  async countRunningByType(workerType: WorkerType): Promise<number> {
    return this.count({ where: { workerType, status: WorkerRunStatus.RUNNING } });
  }
}
