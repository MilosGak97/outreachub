# Object-Related Module — Potential Improvements

A living list of UX, performance, and API improvements identified from the current implementation. Grouped by impact area.

---

## 1. Field Value Experience

### 1.1 Computed Formula Values Are Never Returned
**Current state:** Formula fields are blocked from being set on write, but the computed value is never calculated or returned. `fieldValues` for a formula field is just `{}` or missing.

**Impact:** Formula fields are completely invisible to consumers — the feature exists at the schema level but delivers no data.

**Improvement:** On `GET /crm-object/:id` and list endpoints, compute and return formula field values inline. Formula evaluation should run per-record using `dependsOnFields` from `configShape` so only the relevant fields are loaded.

---

### 1.2 `fieldValues` Returns Raw JSONB — No Type Envelope
**Current state:** `fieldValues` is a flat `Record<string, any>`. Consumers need to know the field type to interpret each value.

**Impact:** Frontend must separately fetch field definitions and join them client-side to make sense of the data.

**Improvement:** Two options:
- (Lightweight) Add a `fieldMeta` sidecar to list responses: `{ [apiName]: { type, label, required } }` once per response, not per record.
- (Full) Always return values as `{ type, value }` envelopes: `{ "revenue": { "type": "currency", "value": 50000 } }`.

The `/full` endpoint already does a version of this — make it the default or expose a `?withMeta=true` query flag.

---

### 1.3 No Partial Field Update Validation Feedback
**Current state:** `PATCH /crm-object/:id` validates field values and throws a `400` with the first error.

**Improvement:** Return **all** validation errors in a single response (not just the first), keyed by field `apiName`:

```json
{
  "errors": {
    "email": "Invalid email format",
    "revenue": "Value must be a positive number"
  }
}
```

---

### 1.4 No Field-Level History / Audit Log
**Current state:** Only `updatedAt` exists on `CrmObject`. There is no record of which field changed, when, or by whom.

**Improvement:** Add a lightweight `CrmObjectFieldChange` event table (or JSONB append-only log) with `{ objectId, fieldApiName, oldValue, newValue, changedByUserId, changedAt }`. Expose `GET /crm-object/:id/history` to read it.

---

## 2. Association UX

### 2.1 Fetching Associations Requires Multiple Requests
**Current state:** `GET /crm-object/:id/associations` groups associations and returns up to 5 linked objects per group. Getting the full list for a group requires a separate call to `GET /crm-object-association?...`.

**Improvement:** Add a paginated sub-resource endpoint:

```
GET /crm-object/:id/associations/:typeId/objects?limit=20&offset=0
```

Returns the paginated list of linked objects for one association type + role, avoiding the need to call the generic association endpoint.

---

### 2.2 No Association Metadata Editing
**Current state:** `CrmObjectAssociation` has a `metadata` JSONB field that is set on creation but never updatable.

**Improvement:** Add `PATCH /crm-object-association/:id` to update the `metadata` field. Useful for storing association-specific data (e.g., "start date" on a "Person works at Company" link).

---

### 2.3 Deleting an Object Does Not Surface Association Cascade Warning
**Current state:** Deleting a `CrmObject` cascades to its associations silently.

**Improvement:** Add a `GET /crm-object/:id/deletion-impact` endpoint that returns counts of what will be deleted (associated records affected, associations removed). Frontend can present a confirmation with real numbers before the user confirms.

---

## 3. Schema Management

### 3.1 Field Reordering Not Supported
**Current state:** Fields have no `position` or `order` column. The order returned is insertion order (database natural order).

**Improvement:** Add an `order` integer column to `CrmObjectField`. Expose `PATCH /crm-object-field/reorder` that accepts `[{ id, order }]` and bulk-updates positions. Display order is purely cosmetic but critical for a good form/table UI.

---

### 3.2 No Field Deprecation / Soft-Delete
**Current state:** Deleting a field hard-deletes it. Existing `fieldValues` on objects retain the key but it becomes orphaned (no schema definition).

**Improvement:** Add `isDeprecated: boolean` to `CrmObjectField`. Deprecated fields are hidden in the UI but their data is still readable. Hard delete can be a separate two-step action ("deprecate → confirm delete with data migration notice").

---

### 3.3 `apiName` Cannot Be Changed After Creation
**Current state:** `UpdateCrmObjectTypeDto` and `UpdateCrmObjectFieldDto` only allow updating `name` / `description`. `apiName` is immutable once set.

**Improvement:** Allow `apiName` rename with a migration step: when `apiName` changes, rename the key in all `CrmObject.fieldValues` JSONB in a background job. Expose the rename as a separate deliberate action (not part of the normal PATCH) to make its cost explicit.

---

### 3.4 No Object Type Cloning / Template Instantiation Surface
**Current state:** `CrmObjectType` has `templateOriginId` and `protection` fields suggesting a template system, but no endpoints expose cloning or template instantiation.

**Improvement:** Expose `POST /crm-object-type/:id/clone` to create a copy of an object type (with all its fields) under the same or different name. Useful for "start from a standard Contact type."

---

## 4. Querying & Filtering

### 4.1 Search is Limited to `displayName`
**Current state:** `GET /crm-object` with `searchQuery` likely filters on `displayName`. There is no way to filter by field values.

**Improvement:** The `POST /crm-object/search` endpoint exists for field-level filtering — but it appears to be a stub or early-stage. A proper filter DSL would look like:

```json
{
  "objectTypeId": "uuid",
  "filters": [
    { "field": "status", "operator": "eq", "value": "active" },
    { "field": "revenue", "operator": "gte", "value": 10000 }
  ],
  "sort": [{ "field": "created_at", "direction": "desc" }]
}
```

Supported operators per field type: `eq`, `neq`, `contains`, `starts_with` (string), `gt`, `gte`, `lt`, `lte` (number/date), `in` (select).

---

### 4.2 No Sorting on List Endpoints
**Current state:** All list endpoints return records in insertion order with no `sort` parameter.

**Improvement:** Add `sort` and `sortDir` query params to `GET /crm-object`:

```
GET /crm-object?objectTypeId=...&sort=displayName&sortDir=asc
```

For field value sorting, accept `sort=field:revenue&sortDir=desc` to sort by a JSONB path.

---

### 4.3 No Count-Only Endpoint
**Current state:** Getting a record count requires a full paginated fetch. Large datasets return unnecessary data.

**Improvement:** Add `GET /crm-object/count?objectTypeId=uuid` returning `{ count: number }`. Useful for dashboard badges and confirmation dialogs.

---

## 5. Import UX

### 5.1 Import Progress Is Polling-Only
**Current state:** `GET /sessions/:id/jobs/:jobId` must be polled to track import progress.

**Improvement:** Add Server-Sent Events (SSE) or WebSocket support at `GET /sessions/:id/jobs/:jobId/events` to push progress updates (rows processed, rows failed, current status) without polling overhead.

---

### 5.2 No Dry-Run Mode
**Current state:** Import jobs write data immediately. Errors are only surfaced in the results after execution.

**Improvement:** Add a `dryRun: true` flag to `POST /sessions/:id/jobs`. A dry-run validates all rows against the schema and match rules, returns projected `created/updated/skipped/failed` counts and a sample of error rows — without writing anything. Extremely useful for large imports to confirm before committing.

---

### 5.3 Import Session Has No Expiry / Cleanup
**Current state:** Import sessions and their staging data (file metadata, draft fields, parsed rows) accumulate indefinitely.

**Improvement:** Add a `expiresAt` field to import sessions, defaulting to 7 days after creation. A scheduled cleanup job removes expired sessions and their associated S3 files. Surface `expiresAt` in the session response so the UI can warn users.

---

### 5.4 No Re-Run or Resume for Failed Jobs
**Current state:** If an import job fails partway through, there is no way to resume or retry only failed rows.

**Improvement:** Add `POST /sessions/:id/jobs/:jobId/retry` that replays only the rows marked as `failed` in the import results.

---

## 6. Performance

### 6.1 No Field Value Indexing
**Current state:** `fieldValues` is stored as JSONB with no GIN index. Field-level filtering (when implemented) will require sequential scans.

**Improvement:** Add a `GIN` index on `CrmObject.fieldValues`:

```sql
CREATE INDEX idx_crm_object_field_values ON crm_objects USING gin(field_values);
```

For high-cardinality fields that are commonly filtered (e.g., `status`, `owner_id`), consider materializing them as generated columns with B-tree indexes.

---

### 6.2 `GET /crm-object/:id/full` Is N+1 on Associations
**Current state:** The `/full` response fetches association groups and then loads linked object previews, likely in a loop.

**Improvement:** Load all association data in a single query using a `JOIN` and aggregate the previews in the application layer. Add a query limit (e.g., max 3 association types shown in `/full`) with a `GET /crm-object/:id/associations` call for the rest.

---

### 6.3 Bulk Operations Are Sequential
**Current state:** Bulk create/update loops through items one by one inside a single transaction.

**Improvement:** For bulk creates, use `INSERT ... VALUES (...), (...), (...)` batch inserts instead of individual saves. For validation, run all validations before any writes and return all errors upfront rather than failing mid-batch.

---

## 7. API Ergonomics

### 7.1 List Endpoints Require `limit` and `offset` — No Defaults
**Current state:** `limit` and `offset` are marked as required. Omitting them causes a validation error.

**Improvement:** Make them optional with sensible defaults (`limit=20`, `offset=0`) and add a `MAX_LIMIT` guard (e.g., 100) to prevent accidental full-table fetches.

---

### 7.2 No `ETag` / Conditional Requests
**Current state:** No cache headers are set. Clients always receive a full response.

**Improvement:** Add `ETag` headers to single-record `GET` responses (hash of `updatedAt`). Support `If-None-Match` to return `304 Not Modified` when unchanged. Especially valuable for the field definitions endpoint which rarely changes.

---

### 7.3 `GET /crm-object-field/definition` Has No Versioning
**Current state:** The field type registry is served with no cache or version headers.

**Improvement:** Add `Cache-Control: public, max-age=3600` since field type definitions change only on deploy. Also add an `ETag` based on a hash of the registry so clients can detect changes.

---

### 7.4 Inconsistent Delete Response
**Current state:** Delete endpoints return `{ message: "..." }` but no confirmation of what was deleted (no `id` returned).

**Improvement:** Return `{ id: "uuid", message: "Deleted successfully" }` from all delete endpoints for consistent client handling.

---

## 8. Developer Experience

### 8.1 No Webhook / Event System
**Current state:** Consumers have no way to react to CRM changes (new object, field value update, new association) without polling.

**Improvement:** Add a webhook registration system:
- `POST /webhooks` → register URL + event types
- Events: `object.created`, `object.updated`, `object.deleted`, `association.created`, etc.
- Deliver signed `POST` payloads to registered URLs

---

### 8.2 No Public API Key Auth
**Current state:** All access requires a user JWT (session-based). There is no way to call the API from a server-to-server integration.

**Improvement:** Add API key authentication (`X-API-Key: ...` header) as an alternative to JWT, scoped to a company. Keys can be created/revoked via a `/api-keys` management endpoint.

---
