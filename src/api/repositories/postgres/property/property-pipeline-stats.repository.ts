import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StatesAbbreviation } from '../../../enums/common/states-abbreviation.enum';

export type PropertyPipelineStats = {
  enrichedRemaining: number;
  enrichedCompleted: number;
  mosaicRemaining: number;
  mosaicCompleted: number;
  filteredRemaining: number;
  filteredCompleted: number;
  importCompleted: number;
};

export type PropertyPipelineStatsByState = {
  perState: Map<StatesAbbreviation, PropertyPipelineStats>;
  totals: PropertyPipelineStats;
};

@Injectable()
export class PropertyPipelineStatsRepository {
  constructor(private readonly dataSource: DataSource) {}

  async getPipelineStatsByState(
    runDate: string,
    stateFilter?: StatesAbbreviation[],
  ): Promise<PropertyPipelineStatsByState> {
    const perState = new Map<StatesAbbreviation, PropertyPipelineStats>();
    for (const state of Object.values(StatesAbbreviation)) {
      perState.set(state, {
        enrichedRemaining: 0,
        enrichedCompleted: 0,
        mosaicRemaining: 0,
        mosaicCompleted: 0,
        filteredRemaining: 0,
        filteredCompleted: 0,
        importCompleted: 0,
      });
    }

    const normalizedStates = this.normalizeStateFilter(stateFilter);
    const propertyStateFilter = this.buildStateFilterClause('state', normalizedStates, 1);

    const enrichmentStateFilter = this.buildStateFilterClause('p.state', normalizedStates, 2);
    const filteredStateFilter = this.buildStateFilterClause('p.state', normalizedStates, 2);
    const importStateFilter = this.buildStateFilterClause('p.state', normalizedStates, 2);

    const [
      enrichedRemainingRows,
      mosaicRemainingRows,
      filteredRemainingRows,
      enrichedCompletedRows,
      mosaicCompletedRows,
      filteredCompletedRows,
      importCompletedRows,
    ] = await Promise.all([
      this.dataSource.query(
        `
        SELECT
          state AS state,
          COUNT(*) AS enriched_remaining
        FROM properties
        WHERE state IS NOT NULL
          AND (enriched = false OR enriched IS NULL)
          ${propertyStateFilter.clause}
        GROUP BY state
      `,
        propertyStateFilter.params,
      ),
      this.dataSource.query(
        `
        SELECT
          state AS state,
          COUNT(*) AS mosaic_remaining
        FROM properties
        WHERE state IS NOT NULL
          AND enriched = true
          AND (mosaic = false OR mosaic IS NULL)
          ${propertyStateFilter.clause}
        GROUP BY state
      `,
        propertyStateFilter.params,
      ),
      this.dataSource.query(
        `
        SELECT
          p.state AS state,
          COUNT(*) AS mosaic_completed
        FROM "property-mosaic" pm
        JOIN properties p ON p.id = pm.property_id
        WHERE p.state IS NOT NULL
          AND pm.created_at >= $1::date
          AND pm.created_at < ($1::date + interval '1 day')
          ${enrichmentStateFilter.clause}
        GROUP BY p.state
      `,
        [runDate, ...enrichmentStateFilter.params],
      ),
      this.dataSource.query(
        `
        SELECT
          state AS state,
          COUNT(*) AS filtered_remaining
        FROM properties
        WHERE state IS NOT NULL
          AND (filtered = false OR filtered IS NULL)
          ${propertyStateFilter.clause}
        GROUP BY state
      `,
        propertyStateFilter.params,
      ),
      this.dataSource.query(
        `
        SELECT
          p.state AS state,
          COUNT(*) AS enriched_completed
        FROM "property-base-enrichment" be
        JOIN properties p ON p.id = be.property_id
        WHERE p.state IS NOT NULL
          AND be.created_at >= $1::date
          AND be.created_at < ($1::date + interval '1 day')
          ${enrichmentStateFilter.clause}
        GROUP BY p.state
      `,
        [runDate, ...enrichmentStateFilter.params],
      ),
      this.dataSource.query(
        `
        SELECT
          p.state AS state,
          COUNT(*) AS filtered_completed
        FROM "property-ai-filtering" paf
        JOIN properties p ON p.id = paf.property_id
        WHERE p.state IS NOT NULL
          AND paf.created_at >= $1::date
          AND paf.created_at < ($1::date + interval '1 day')
          ${filteredStateFilter.clause}
        GROUP BY p.state
      `,
        [runDate, ...filteredStateFilter.params],
      ),
      this.dataSource.query(
        `
        SELECT
          p.state AS state,
          COUNT(*) AS import_completed
        FROM "property-listings" pl
        JOIN properties p ON p.id = pl.property_id
        WHERE p.state IS NOT NULL
          AND pl.created_at >= $1::date
          AND pl.created_at < ($1::date + interval '1 day')
          ${importStateFilter.clause}
        GROUP BY p.state
      `,
        [runDate, ...importStateFilter.params],
      ),
    ]);

    for (const row of enrichedRemainingRows ?? []) {
      const state = String(row.state || '').toUpperCase() as StatesAbbreviation;
      const entry = perState.get(state);
      if (!entry) continue;
      entry.enrichedRemaining = Number(row.enriched_remaining ?? 0);
    }

    for (const row of mosaicRemainingRows ?? []) {
      const state = String(row.state || '').toUpperCase() as StatesAbbreviation;
      const entry = perState.get(state);
      if (!entry) continue;
      entry.mosaicRemaining = Number(row.mosaic_remaining ?? 0);
    }

    for (const row of mosaicCompletedRows ?? []) {
      const state = String(row.state || '').toUpperCase() as StatesAbbreviation;
      const entry = perState.get(state);
      if (!entry) continue;
      entry.mosaicCompleted = Number(row.mosaic_completed ?? 0);
    }

    for (const row of filteredRemainingRows ?? []) {
      const state = String(row.state || '').toUpperCase() as StatesAbbreviation;
      const entry = perState.get(state);
      if (!entry) continue;
      entry.filteredRemaining = Number(row.filtered_remaining ?? 0);
    }

    for (const row of enrichedCompletedRows ?? []) {
      const state = String(row.state || '').toUpperCase() as StatesAbbreviation;
      const entry = perState.get(state);
      if (!entry) continue;
      entry.enrichedCompleted = Number(row.enriched_completed ?? 0);
    }

    for (const row of filteredCompletedRows ?? []) {
      const state = String(row.state || '').toUpperCase() as StatesAbbreviation;
      const entry = perState.get(state);
      if (!entry) continue;
      entry.filteredCompleted = Number(row.filtered_completed ?? 0);
    }

    for (const row of importCompletedRows ?? []) {
      const state = String(row.state || '').toUpperCase() as StatesAbbreviation;
      const entry = perState.get(state);
      if (!entry) continue;
      entry.importCompleted = Number(row.import_completed ?? 0);
    }

    const totals: PropertyPipelineStats = {
      enrichedRemaining: 0,
      enrichedCompleted: 0,
      mosaicRemaining: 0,
      mosaicCompleted: 0,
      filteredRemaining: 0,
      filteredCompleted: 0,
      importCompleted: 0,
    };

    for (const entry of perState.values()) {
      totals.enrichedRemaining += entry.enrichedRemaining;
      totals.enrichedCompleted += entry.enrichedCompleted;
      totals.mosaicRemaining += entry.mosaicRemaining;
      totals.mosaicCompleted += entry.mosaicCompleted;
      totals.filteredRemaining += entry.filteredRemaining;
      totals.filteredCompleted += entry.filteredCompleted;
      totals.importCompleted += entry.importCompleted;
    }

    return { perState, totals };
  }

  private normalizeStateFilter(
    stateFilter?: StatesAbbreviation[],
  ): StatesAbbreviation[] | undefined {
    if (!stateFilter || stateFilter.length === 0) return undefined;
    const validStates = new Set(Object.values(StatesAbbreviation));
    const normalized = stateFilter
      .map((state) => String(state || '').toUpperCase())
      .filter((state) => validStates.has(state as StatesAbbreviation));
    const unique = Array.from(new Set(normalized)) as StatesAbbreviation[];
    return unique.length > 0 ? unique : undefined;
  }

  private buildStateFilterClause(
    column: string,
    states?: StatesAbbreviation[],
    paramIndex = 1,
  ): { clause: string; params: [StatesAbbreviation[]] | [] } {
    if (!states || states.length === 0) {
      return { clause: '', params: [] };
    }
    return {
      clause: `AND ${column} = ANY($${paramIndex})`,
      params: [states],
    };
  }
}
