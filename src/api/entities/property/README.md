## Properties domain quick reference

- **Property** (`properties`): base record for an address scraped from external sources. Holds location data, pricing, metadata from Zillow/bright data. Links to `County`, optional `PropertyHomeownerEnrichment`, `PropertyAiFiltering`, and `Dealmachine` rows.
- **County** (`counties`): grouping + pricing info for a geography. References `State` enum, optional scrape config (`zillowLinks`, `zillowDefineInput`, `scrappingEndDate`).
- **PropertyListing** (`property-listings`): status history for a property (e.g., for-sale, sold). Unique per property + status.
- **PropertyHomeownerEnrichment**: owner/person-level enrichment for a property (names, isCommercial, raw data).
- **PropertyAiFiltering**: AI/ML filtering job state for a property. Tracks job status and the filtered outcome.
- **PropertyMosaic**: per-property mosaic asset record with S3 key.
- **Dealmachine**: contact details for a property fetched from Dealmachine.
- **UserExtrasAccess**: grants a user extra access to a property, with an access type and token usage.
- **UserVisibleListing**: which property listings are visible to which users.

### Typical scrape/enrichment flow
1) **Seed properties**: when a scrape runs, create `Property` rows with core location/price fields.
2) **Listing status**: insert a `PropertyListing` row per property status (for-sale, pending, sold) to track timeline.
3) **Enrichment**: if homeowner data is fetched, create/update `PropertyHomeownerEnrichment` for that property.
4) **AI filtering**: move `Property.aiStatus` through the mosaic/AI pipeline (`mosaic_pending` → `mosaic_processing` → `mosaic_ready` → `ai_pending` → `filtered`/`ai_failed`); update `PropertyAiFiltering.jobStatus` and `filteredStatus` with job progress/outcome.
5) **Access/visibility**: use `UserExtrasAccess` to grant extra rights and `UserVisibleListing` to control which listings a user can see.

### Status enums used
- `ai-status.enum.ts`: canonical mosaic/AI pipeline state for `Property` rows.
- `property-status.enum.ts`: status values for listings.
- `ai-filtering-job-status.enum.ts`: lifecycle of AI filtering jobs.
- `filtered-status.enum.ts`: AI filtering outcome.
- `user-extras-access-type.enum.ts`: types of extra access grants.
- `state.enum.ts`: US states (for counties).

### Notes when extending
- Keep relations symmetrical (`Property` ↔ `PropertyAiFiltering` / `PropertyHomeownerEnrichment`) and prefer `onDelete: 'CASCADE'` where dependent records should be cleaned up.
- Use JSONB columns (`photos`, `zillowDefineInput`, raw enrichment data) for variable payloads returned by scrapers.
- When adding new scraper-driven fields, prefer nullable columns with clear naming that mirrors the source payload to keep ingestion simple.
