import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PropertySummary } from '../../../entities/property/property-summary.entity';

export type PropertySummaryUpsert = Omit<
  PropertySummary,
  'createdAt' | 'updatedAt'
>;

@Injectable()
export class PropertySummaryRepository extends Repository<PropertySummary> {
  constructor(private readonly dataSource: DataSource) {
    super(PropertySummary, dataSource.createEntityManager());
  }

  async upsertRows(rows: PropertySummaryUpsert[]): Promise<void> {
    if (rows.length === 0) return;

    await this.createQueryBuilder()
      .insert()
      .into(PropertySummary)
      .values(rows)
      .orUpdate(
        [
          'total_jobs',
          'success',
          'pending',
          'running',
          'failed',
          'retrying',
          'changed_count',
          'new_count',
          'changed_and_new_count',
          'remaining',
          'enriched_remaining',
          'enriched_completed',
          'mosaic_remaining',
          'mosaic_completed',
          'filtered_remaining',
          'filtered_completed',
          'import_completed',
          'import_remaining',
        ],
        ['run_date', 'state'],
      )
      .execute();
  }

  async findByRunDate(runDate: string): Promise<PropertySummary[]> {
    return this.find({ where: { runDate } });
  }

  async getTotalsByRunDate(runDate: string): Promise<Record<string, number>> {
    const [row] = await this.dataSource.query(
      `
      SELECT
        COALESCE(SUM(total_jobs), 0) AS total_jobs,
        COALESCE(SUM(success), 0) AS success,
        COALESCE(SUM(pending), 0) AS pending,
        COALESCE(SUM(running), 0) AS running,
        COALESCE(SUM(failed), 0) AS failed,
        COALESCE(SUM(retrying), 0) AS retrying,
        COALESCE(SUM(changed_count), 0) AS changed_count,
        COALESCE(SUM(new_count), 0) AS new_count,
        COALESCE(SUM(changed_and_new_count), 0) AS changed_and_new_count,
        COALESCE(SUM(remaining), 0) AS remaining,
        COALESCE(SUM(enriched_remaining), 0) AS enriched_remaining,
        COALESCE(SUM(enriched_completed), 0) AS enriched_completed,
        COALESCE(SUM(mosaic_remaining), 0) AS mosaic_remaining,
        COALESCE(SUM(mosaic_completed), 0) AS mosaic_completed,
        COALESCE(SUM(filtered_remaining), 0) AS filtered_remaining,
        COALESCE(SUM(filtered_completed), 0) AS filtered_completed,
        COALESCE(SUM(import_completed), 0) AS import_completed,
        COALESCE(SUM(import_remaining), 0) AS import_remaining
      FROM "property-summary"
      WHERE run_date = $1::date
    `,
      [runDate],
    );

    return {
      totalJobs: Number(row?.total_jobs ?? 0),
      success: Number(row?.success ?? 0),
      pending: Number(row?.pending ?? 0),
      running: Number(row?.running ?? 0),
      failed: Number(row?.failed ?? 0),
      retrying: Number(row?.retrying ?? 0),
      changedCount: Number(row?.changed_count ?? 0),
      newCount: Number(row?.new_count ?? 0),
      changedAndNewCount: Number(row?.changed_and_new_count ?? 0),
      remaining: Number(row?.remaining ?? 0),
      enrichedRemaining: Number(row?.enriched_remaining ?? 0),
      enrichedCompleted: Number(row?.enriched_completed ?? 0),
      mosaicRemaining: Number(row?.mosaic_remaining ?? 0),
      mosaicCompleted: Number(row?.mosaic_completed ?? 0),
      filteredRemaining: Number(row?.filtered_remaining ?? 0),
      filteredCompleted: Number(row?.filtered_completed ?? 0),
      importCompleted: Number(row?.import_completed ?? 0),
      importRemaining: Number(row?.import_remaining ?? 0),
    };
  }

  async getTotalsByLatestRunDate(): Promise<Record<string, number>> {
    const [row] = await this.dataSource.query(
      `
      SELECT
        COALESCE(SUM(total_jobs), 0) AS total_jobs,
        COALESCE(SUM(success), 0) AS success,
        COALESCE(SUM(pending), 0) AS pending,
        COALESCE(SUM(running), 0) AS running,
        COALESCE(SUM(failed), 0) AS failed,
        COALESCE(SUM(retrying), 0) AS retrying,
        COALESCE(SUM(changed_count), 0) AS changed_count,
        COALESCE(SUM(new_count), 0) AS new_count,
        COALESCE(SUM(changed_and_new_count), 0) AS changed_and_new_count,
        COALESCE(SUM(remaining), 0) AS remaining,
        COALESCE(SUM(enriched_remaining), 0) AS enriched_remaining,
        COALESCE(SUM(enriched_completed), 0) AS enriched_completed,
        COALESCE(SUM(mosaic_remaining), 0) AS mosaic_remaining,
        COALESCE(SUM(mosaic_completed), 0) AS mosaic_completed,
        COALESCE(SUM(filtered_remaining), 0) AS filtered_remaining,
        COALESCE(SUM(filtered_completed), 0) AS filtered_completed,
        COALESCE(SUM(import_completed), 0) AS import_completed,
        COALESCE(SUM(import_remaining), 0) AS import_remaining
      FROM "property-summary"
      WHERE run_date = (SELECT MAX(run_date) FROM "property-summary")
    `,
    );

    return {
      totalJobs: Number(row?.total_jobs ?? 0),
      success: Number(row?.success ?? 0),
      pending: Number(row?.pending ?? 0),
      running: Number(row?.running ?? 0),
      failed: Number(row?.failed ?? 0),
      retrying: Number(row?.retrying ?? 0),
      changedCount: Number(row?.changed_count ?? 0),
      newCount: Number(row?.new_count ?? 0),
      changedAndNewCount: Number(row?.changed_and_new_count ?? 0),
      remaining: Number(row?.remaining ?? 0),
      enrichedRemaining: Number(row?.enriched_remaining ?? 0),
      enrichedCompleted: Number(row?.enriched_completed ?? 0),
      mosaicRemaining: Number(row?.mosaic_remaining ?? 0),
      mosaicCompleted: Number(row?.mosaic_completed ?? 0),
      filteredRemaining: Number(row?.filtered_remaining ?? 0),
      filteredCompleted: Number(row?.filtered_completed ?? 0),
      importCompleted: Number(row?.import_completed ?? 0),
      importRemaining: Number(row?.import_remaining ?? 0),
    };
  }

  async getTotalsByDateRange(runDateFrom: string, runDateTo: string): Promise<Record<string, number>> {
    const [row] = await this.dataSource.query(
      `
      SELECT
        COALESCE(SUM(total_jobs), 0) AS total_jobs,
        COALESCE(SUM(success), 0) AS success,
        COALESCE(SUM(pending), 0) AS pending,
        COALESCE(SUM(running), 0) AS running,
        COALESCE(SUM(failed), 0) AS failed,
        COALESCE(SUM(retrying), 0) AS retrying,
        COALESCE(SUM(changed_count), 0) AS changed_count,
        COALESCE(SUM(new_count), 0) AS new_count,
        COALESCE(SUM(changed_and_new_count), 0) AS changed_and_new_count,
        COALESCE(SUM(remaining), 0) AS remaining,
        COALESCE(SUM(enriched_remaining), 0) AS enriched_remaining,
        COALESCE(SUM(enriched_completed), 0) AS enriched_completed,
        COALESCE(SUM(mosaic_remaining), 0) AS mosaic_remaining,
        COALESCE(SUM(mosaic_completed), 0) AS mosaic_completed,
        COALESCE(SUM(filtered_remaining), 0) AS filtered_remaining,
        COALESCE(SUM(filtered_completed), 0) AS filtered_completed,
        COALESCE(SUM(import_completed), 0) AS import_completed,
        COALESCE(SUM(import_remaining), 0) AS import_remaining
      FROM "property-summary"
      WHERE run_date >= $1::date
        AND run_date <= $2::date
    `,
      [runDateFrom, runDateTo],
    );

    return {
      totalJobs: Number(row?.total_jobs ?? 0),
      success: Number(row?.success ?? 0),
      pending: Number(row?.pending ?? 0),
      running: Number(row?.running ?? 0),
      failed: Number(row?.failed ?? 0),
      retrying: Number(row?.retrying ?? 0),
      changedCount: Number(row?.changed_count ?? 0),
      newCount: Number(row?.new_count ?? 0),
      changedAndNewCount: Number(row?.changed_and_new_count ?? 0),
      remaining: Number(row?.remaining ?? 0),
      enrichedRemaining: Number(row?.enriched_remaining ?? 0),
      enrichedCompleted: Number(row?.enriched_completed ?? 0),
      mosaicRemaining: Number(row?.mosaic_remaining ?? 0),
      mosaicCompleted: Number(row?.mosaic_completed ?? 0),
      filteredRemaining: Number(row?.filtered_remaining ?? 0),
      filteredCompleted: Number(row?.filtered_completed ?? 0),
      importCompleted: Number(row?.import_completed ?? 0),
      importRemaining: Number(row?.import_remaining ?? 0),
    };
  }
}
