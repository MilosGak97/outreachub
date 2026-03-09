# Saved Filter Presets — Living Spec (Engineering)

> **Feature folder:** `docs/features/saved-filter-presets/`  
> **This file:** `spec.md`  
> **Source docs:** `context.md`, `prd.md`, `ux.md`

---

## 1) Overview

### Purpose
Implement **Saved Filter Presets** for list pages (tables) so a user can save a named set of filters (including **search text**) and re-apply it later, with an optional **Default preset** that auto-applies on page open.

This spec is the **engineering source of truth** for: data model, API contract, validation rules, business rules, error model, audit/logging, performance, and testing.

### Links
- Context: `docs/features/saved-filter-presets/context.md`
- PRD: `docs/features/saved-filter-presets/prd.md`
- UX: `docs/features/saved-filter-presets/ux.md` (generated from UX prompt / UX Pilot designs)

### Fixed decisions (must not drift)
- **Filters-only**: no columns, sorting, or layout.
- **Scope key:** `conceptKey + tableId` (plus tenant + user)
- **Private per-user**; tenant-safe by `companyId`
- **Admin/Client sharing:** presets are shared across surfaces when using the same **conceptKey**
- **Default preset**: if set, auto-applies on page open; clearing default returns to **normal view** (no filters)
- **Includes search text** in saved state
- **Applying preset resets pagination** to `page 1 / offset 0`
- **URL format**: `presetId` only (no raw filters in URL)
- **Dynamic fields**: missing/changed fields are **ignored** (silent)
- **Overwrite** updates **name + filters**
- **Naming**: unique per context; **limit 50** presets per context

---

## 2) Terminology

- **Preset / Filter Preset**: a saved, named filter state for one list/table context.
- **Filter state**: everything that affects the list query from the filter UI, including **search text** and filter controls (chips/selects/ranges/etc.).
- **conceptKey**: stable identifier meaning “same logical list concept” across Admin + Client surfaces (examples: `companies`, `admins`, `crmObject:<objectApiName>`).  
  - Required so we can share presets when Admin and Client are “the same concept”.
- **tableId**: stable identifier for a table instance within a page (a page may contain multiple tables).
- **context**: the unique scope where presets apply. In this feature: `companyId + owner + conceptKey + tableId`.
- **Default preset**: the preset auto-applied when opening a list/table context.
- **Custom state** (UX): UI state when current filters differ from the applied preset. (Backend supports this by returning applied preset info; UI compares state.)

---

## 3) Scope Key & Context Rules

### Context definition (source of truth)
A preset applies only when all context attributes match:

- `companyId` (tenant isolation)
- `ownerType` + `ownerId` (private per user)
- `conceptKey`
- `tableId`

**ContextKey (logical):**
```
contextKey = conceptKey + "::" + tableId
```

### Admin + Client sharing
- Presets are shared across Admin and Client surfaces **only** by using the same `conceptKey`.
- The API should not hard-split storage by surface if `conceptKey` is the same.
- The frontend for Admin and Client must agree on `conceptKey` strings for shared concepts.

### Required inputs for list endpoints (to enable defaults)
To auto-apply defaults server-side on initial load, list requests must provide:
- `conceptKey`
- `tableId`

> If an existing list endpoint cannot provide these, auto-default behavior becomes impossible without hardcoding endpoint → conceptKey mapping on the backend (TBD). Preferred is to pass both as query parameters on list calls.

Best practice (recommended): UI defines them, backend just enforces

<b>How React knows </b>

>React already knows which page/table it’s rendering. So you set:<br><ul><li>
•	conceptKey: a stable string you define for that page’s list concept </li>
Examples:
•	Admin Companies page → "companies"
•	Admin Admins page → "admins"
•	Dynamic object list page → "crmObject:<objectApiName>" (or use objectTypeId)
•	tableId: stable id for that table component on that page
Examples:
•	main table → "main"
•	if a page has 2 tables → "main" and "archived" <br> <br>
<b>What changes in code</b> <br>
You make a small frontend “registry” (just a map) per list page, like:
•	conceptKey comes from route/page definition
•	tableId comes from the table component props
<br>
Then every list API call includes conceptKey + tableId + optional presetId <br><br>
Why this is best: no backend guessing, works for static + dynamic, and enables Admin/Client “shared if same conceptKey”
---

## 4) Data Model Design (no code)

> Goal: store filter presets with strict tenant isolation and unique defaults.

### Entity: `FilterPreset`
Required fields (conceptual types):

- `id`: UUID
- `companyId`: UUID (tenant)
  - **TBD for “global admin” pages** (if any truly have no company context): either store `companyId = NULL` and treat it as separate scope, or require a chosen company context.
- `ownerType`: enum
  - Suggested: `USER | ADMIN` (because your repo has both user and admin auth)
- `ownerId`: UUID
- `conceptKey`: string (indexed)
- `tableId`: string (indexed)
- `name`: string
- `isDefault`: boolean
- `filterState`: JSONB (see “Filter state format” below)
- `version`: integer (start at 1; allows future migrations)
- `createdAt`, `updatedAt`: timestamps
- Optional: `deletedAt` if you prefer soft-delete (TBD)

#### Constraints
- **Name uniqueness per context**
  - Unique on: `(companyId, ownerType, ownerId, conceptKey, tableId, lower(name))`
- **Single default per context**
  - Enforce one preset with `isDefault = true` per:
    - `(companyId, ownerType, ownerId, conceptKey, tableId)`
  - Implementation options:
    - partial unique index (`WHERE isDefault = true`)
    - or transactional “unset previous default” on set-default

#### Indexes
- Lookup presets for a context:
  - `(companyId, ownerType, ownerId, conceptKey, tableId)`
- Fast default fetch:
  - `(companyId, ownerType, ownerId, conceptKey, tableId, isDefault)`
- Fast by id:
  - `(id)` (primary)

### Filter state format (stored JSONB)
We need two formats:
1) **Static pages**: store endpoint-specific filters in a normalized JSON structure.
2) **Dynamic object pages**: store filters referencing fields by `fieldId` to remain stable.

#### Canonical stored shape (v1)
```
filterState = {
  "version": 1,
  "searchText": string | null,
  "filters": object,
  "meta": {
     "createdFrom": "ui" | "migration" | null
  }
}
```

**Static pages (`filters`):**
- `filters` is a JSON object representing the normalized filter inputs used by the list query DTO (after transforms).
- Example:
```
{
  "counties": ["Cook County, IL"],
  "status": ["active"]
}
```

**Dynamic object pages (`filters`):**
- `filters` is a structured expression referencing dynamic fields by `fieldId`.
- Suggested minimal structure:
```
{
  "logic": "AND",
  "items": [
    { "fieldId": "<uuid>", "op": "eq", "value": "Active" },
    { "fieldId": "<uuid>", "op": "in", "value": ["IL", "WI"] }
  ]
}
```
- Missing/changed fields: ignore items where `fieldId` is not resolvable for the object type (silent).

> **Note:** This spec does not require all list endpoints to implement the “dynamic expression” format immediately; but any dynamic object preset must be stored by `fieldId`.

---

## 5) API Contract (endpoints + examples)

> Two “surfaces” can exist as separate route prefixes, but the storage and behavior is the same (shared by conceptKey).

### Common concepts
- All preset operations are **scoped to the authenticated actor** (user or admin) and `companyId`.
- All list operations are scoped to a `conceptKey + tableId`.

### 5.1 Preset CRUD endpoints

#### List presets for a context
**GET** `/filter-presets?conceptKey=...&tableId=...`

Response (example):
```json
{
  "context": { "conceptKey": "companies", "tableId": "main" },
  "items": [
    { "id": "uuid1", "name": "Illinois", "isDefault": true, "updatedAt": "..." },
    { "id": "uuid2", "name": "Active Only", "isDefault": false, "updatedAt": "..." }
  ],
  "limit": 50
}
```

Notes:
- Do **not** return presets from other contexts.
- Recommend returning items sorted by: default first, then name.

#### Create preset (save current filters)
**POST** `/filter-presets`

Request:
```json
{
  "conceptKey": "companies",
  "tableId": "main",
  "name": "Illinois",
  "isDefault": true,
  "filterState": {
    "version": 1,
    "searchText": null,
    "filters": { "state": ["IL"] }
  }
}
```

Response: created preset (id + fields).

#### Update preset (overwrite: name + filters)
**PATCH** `/filter-presets/{presetId}`

Request:
```json
{
  "name": "Illinois - Active",
  "filterState": {
    "version": 1,
    "searchText": "move",
    "filters": { "state": ["IL"], "status": ["active"] }
  }
}
```

Notes:
- This is the “Overwrite” action from UX.

#### Set default
Option A (recommended): same PATCH
**PATCH** `/filter-presets/{presetId}`
```json
{ "isDefault": true }
```

#### Clear default
Option A (recommended): context-based endpoint
**DELETE** `/filter-presets/default?conceptKey=...&tableId=...`

Response:
```json
{ "cleared": true }
```

#### Delete preset
**DELETE** `/filter-presets/{presetId}`

Behavior:
- If deleted preset was default, default becomes cleared (no fallback preset auto-selected).

### 5.2 List endpoint integration

To support server-side auto-apply default, list endpoints must accept:
- `conceptKey`
- `tableId`
- optional `presetId`

**Rules:**
1) If `presetId` provided → apply that preset (must belong to user + company + same conceptKey/tableId).
2) Else if request is “initial load” (no filters provided) → apply default preset if exists.
3) Else → use request filters only.

> **How to detect “initial load”:** per endpoint, define what constitutes “no filters provided”.  
> For best consistency, front-end should send a boolean like `applyDefault=true` on initial load (TBD). If not, backend can infer from all filter fields being empty/undefined.

#### URL behavior (presetId only)
If UI opens a URL with `presetId=<id>`, the list request should include that `presetId`. The backend applies it and returns applied preset metadata.

### 5.3 Status codes & error codes (high-level)
- `200` success
- `201` created
- `400` bad request (invalid body, invalid filterState format)
- `401` unauthenticated
- `403` forbidden (actor cannot access company context or preset)
- `404` not found (presetId not found in scope)
- `409` conflict (duplicate name per context, default uniqueness conflict)
- `422` validation error (payload too large, invalid filter operator, etc.)

---

## 6) DTO Contract + Validation Rules (no code)

### Common DTO fields
- `conceptKey`: required string (min 1)
- `tableId`: required string (min 1)
- `name`: required string (unique per context)
  - **No max length** (per user), but still recommend a safe DB limit (TBD)
- `isDefault`: optional boolean
- `filterState`: required object

### FilterStateDto (contract)
- `version`: required number (must be `1` for now)
- `searchText`: optional string | null
- `filters`: required object
- `meta`: optional object

#### Static filters validation
- `filters` must be a JSON object.
- Backend should **store normalized values** (e.g., arrays are arrays, numbers are numbers).
- Prevent storing “raw querystring fragments” (security).

#### Dynamic filters validation
- `filters.logic`: enum `AND | OR` (default AND)
- `filters.items`: array
- Each item:
  - `fieldId`: UUID
  - `op`: enum (TBD: supported operators list)
  - `value`: any (validate by operator)
- While applying:
  - if `fieldId` not found for the object type → ignore that item (silent)

### Swagger/type-gen notes (avoid `any[]`)
- For arrays, always specify `type: [SomeDto]` and validation decorators for element typing.
- For `filterState.filters` where shape is dynamic, use:
  - `@ApiProperty({ type: 'object', additionalProperties: true })` (or equivalent)
- Prefer a DTO like `FilterPresetSummaryDto[]` instead of `any[]` in responses.

---

## 7) Business Rules (MUST/SHOULD)

### MUST
- Presets are **private to owner** (user/admin) within a company.
- Presets cannot be read/modified across companies.
- **Unique name per context** (case-insensitive).
- **Max 50 presets per context** enforced.
- Only one default per context.

### MUST — Apply logic
- Applying a preset updates the effective filter state and reloads the list.
- Applying a preset resets pagination to **page 1 / offset 0**.
- When applying a preset on a dynamic object list, missing field filters are ignored (silent).

### SHOULD — Response metadata
List endpoints should include metadata so UI can display active preset:
```json
{
  "appliedPreset": {
    "id": "uuid",
    "name": "Illinois",
    "isDefault": true
  }
}
```
If none applied, `appliedPreset: null`.

### Precedence rules
- `presetId` explicitly provided beats default.
- Default applies only when the request indicates “no filters selected” (see 5.2).
- If both request filters and `presetId` are provided, backend behavior must be deterministic:
  - **Recommended:** `presetId` wins for filter fields; request may still override pagination. (TBD if you want overrides.)

### “Custom” determination
- Backend does not decide “Custom”; UI compares current filter UI state to the applied preset’s stored filterState.
- Backend helps by returning `appliedPreset` + optionally `appliedPresetFilterStateHash` (TBD).

---

## 8) Error Model & Edge Cases

### Auth / scope
- 401 if not authenticated.
- 403 if authenticated but company context mismatched / forbidden.
- 404 if presetId not found for this owner+company.

### Naming conflicts
- Creating or renaming to an existing name in the same context → 409.
- Overwrite that changes name must also respect uniqueness.

### Limit reached
- Creating preset when at 50 for this context → 422 (or 409). Recommend 422.

### Dynamic field changes
- Applying preset where some dynamic fields are missing → silently ignore those filter items.
- If all filter items are ignored, the result becomes “no filters” + searchText (if any).

### Deleted default preset
- If default is deleted, context has no default; next page open returns normal view.

### URL presetId behavior
- URL with presetId:
  - if preset exists in scope → apply
  - if not → do not apply any preset; return normal view + 404 on preset fetch (TBD UX behavior)

---

## 9) Logging / Audit

### Audit events (server-side)
Record:
- `filter_preset_created`
- `filter_preset_updated` (overwrite)
- `filter_preset_deleted`
- `filter_preset_default_set`
- `filter_preset_default_cleared`

Suggested metadata:
- `companyId`
- `ownerType`, `ownerId`
- `conceptKey`, `tableId`
- `presetId`
- `presetName`
- timestamps
- optional: `filterStateSizeBytes` (not the full filters to avoid logging sensitive inputs)

> **Where to store audit logs:** TBD (depends on your existing audit system).

### Telemetry events (client-side)
- `preset_applied` (UI action)
- `preset_saved`
- `preset_overwritten`
- `preset_deleted`

---

## 10) Performance & Limits

- Listing presets should be fast (few rows).
- Default lookup should be indexed (see section 4).
- Apply behavior should not add noticeable latency to list endpoints.
- Limits:
  - 50 presets per context (enforced)
  - FilterState JSON size limit: TBD (recommend a safe cap to prevent abuse)

---

## 11) Testing Matrix

### Preset CRUD
- Create preset
  - happy path
  - missing required fields → 400/422
  - duplicate name → 409
  - over limit 50 → 422
- Update preset (overwrite)
  - happy path (name + filterState)
  - rename conflict → 409
- Set default
  - sets isDefault true and unsets any previous default
- Clear default
  - clears default, no preset becomes default
- Delete
  - deletes preset
  - delete default preset clears default

### Isolation / security
- Cross-tenant access blocked:
  - user in company A cannot access presets in company B
- Cross-user access blocked within same company:
  - user A cannot see/edit user B presets
- Admin vs user ownership:
  - admin preset access uses admin identity only

### List endpoint integration
- Initial load with default:
  - request with no filters applies default
- With presetId:
  - applies presetId and returns appliedPreset metadata
  - invalid presetId returns 404 (TBD UX)
- Pagination reset:
  - applying preset resets to page 1 / offset 0
- Dynamic fields ignored:
  - preset includes non-existent fieldId → ignored; request still succeeds

---

## 12) Manual QA Checklist (Scalar-friendly)

1) Open list page with `conceptKey` + `tableId` (no presets):
   - verify empty preset state shows “Save preset”
2) Apply filters + search; save preset “Test A”:
   - verify preset appears in dropdown
3) Apply preset:
   - UI controls match
   - table reloads
   - pagination reset to first page
4) Set preset as default:
   - reload page; verify default auto-applies
5) Clear default:
   - reload page; verify normal view (no filters)
6) Modify filters after preset applied:
   - verify “Custom” state shows Save As + Overwrite
7) Overwrite:
   - verify saved preset updates name + filter state
8) Delete preset:
   - verify removed from dropdown
   - if default was deleted: default cleared

---

## 13) Migration / Rollout Notes

- New feature should be behind a feature flag if possible (TBD).
- Backward compatibility:
  - list endpoints should work unchanged when no conceptKey/tableId provided (TBD fallback).
- Rollout plan:
  - staging → internal users → production
- Rollback:
  - disable feature flag; presets remain stored but unused

---

## 14) Open Questions / TBDs

1) **Admin “companyId” meaning:** For admin pages that are truly global (e.g., list companies), what `companyId` should presets use? Allow `NULL` scope or use a platform company?
2) **Operator list for dynamic filters:** define supported operators (`eq`, `in`, `contains`, range ops, etc.) and validation rules.
3) **Initial-load detection:** should frontend always send `applyDefault=true` to avoid backend inference?
4) **PresetId + explicit filters precedence:** should preset fully override, or allow explicit overrides?
5) **Audit storage location:** where do audit events live today?
6) **Payload size cap:** choose max JSON size for filterState.

