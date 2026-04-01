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
    const propertyStateFilter = this.buildStateFilterClause('p.state', normalizedStates, 2);

    const rows = await this.dataSource.query(
      `
      WITH imported_properties AS (
        SELECT
          p.id,
          p.state,
          p.enriched,
          p.mosaic,
          p.filtered
        FROM properties p
        WHERE p.state IS NOT NULL
          ${propertyStateFilter.clause}
          AND EXISTS (
            SELECT 1
            FROM "property-listings" pl
            WHERE pl.property_id = p.id
              AND pl.created_at >= $1::date
          )
      )
      SELECT
        state AS state,
        COUNT(*) FILTER (WHERE enriched = true) AS enriched_completed,
        COUNT(*) FILTER (WHERE enriched = false OR enriched IS NULL) AS enriched_remaining,
        COUNT(*) FILTER (WHERE mosaic = true) AS mosaic_completed,
        COUNT(*) FILTER (
          WHERE enriched = true
            AND (mosaic = false OR mosaic IS NULL)
        ) AS mosaic_remaining,
        COUNT(*) FILTER (WHERE filtered = true) AS filtered_completed,
        COUNT(*) FILTER (
          WHERE mosaic = true
            AND (filtered = false OR filtered IS NULL)
        ) AS filtered_remaining,
        COUNT(*) AS import_completed
      FROM imported_properties
      GROUP BY state
    `,
      [runDate, ...propertyStateFilter.params],
    );

    for (const row of rows ?? []) {
      const state = String(row.state || '').toUpperCase() as StatesAbbreviation;
      const entry = perState.get(state);
      if (!entry) continue;
      entry.enrichedCompleted = Number(row.enriched_completed ?? 0);
      entry.enrichedRemaining = Number(row.enriched_remaining ?? 0);
      entry.mosaicCompleted = Number(row.mosaic_completed ?? 0);
      entry.mosaicRemaining = Number(row.mosaic_remaining ?? 0);
      entry.filteredCompleted = Number(row.filtered_completed ?? 0);
      entry.filteredRemaining = Number(row.filtered_remaining ?? 0);
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
