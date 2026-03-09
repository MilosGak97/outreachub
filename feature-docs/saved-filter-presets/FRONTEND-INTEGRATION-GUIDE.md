# Filter Presets — Frontend Integration Guide

> **Audience:** React developers integrating with the Filter Presets API
> **API Base:** `/filter-presets`
> **Auth:** JWT token required (same auth as other client endpoints)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Core Concepts](#2-core-concepts)
3. [Building Context Keys](#3-building-context-keys)
4. [API Endpoints](#4-api-endpoints)
5. [UI Flow & State Machine](#5-ui-flow--state-machine)
6. [Filter State Structure](#6-filter-state-structure)
7. [Integration Checklist](#7-integration-checklist)
8. [Common Scenarios](#8-common-scenarios)
9. [Error Handling](#9-error-handling)
10. [URL Sync (Optional)](#10-url-sync-optional)

---

## 1. Overview

Filter Presets allow users to save filter configurations on any list page and quickly re-apply them later. Each preset is:

- **Private** to the user who created it
- **Scoped** to a specific page/table combination (`conceptKey` + `tableId`)
- **Isolated** by tenant (companyId is handled server-side)

**What gets saved:**
- Search text
- All filter selections (dropdowns, checkboxes, date ranges, etc.)
- Filter logic (AND/OR for dynamic objects)

**What does NOT get saved:**
- Column visibility/order
- Sorting
- Pagination

---

## 2. Core Concepts

### 2.1 Context = Where the preset applies

Every preset is scoped to a **context**, which is defined by two strings:

| Field | Purpose | Example |
|-------|---------|---------|
| `conceptKey` | Identifies the "type" of list | `"companies"`, `"crm:contacts"`, `"crm:deals"` |
| `tableId` | Identifies which table on the page | `"main"`, `"related-contacts"`, `"sub-table-1"` |

**Why two keys?**
- A page might have multiple tables (e.g., a detail page with related records tables)
- Each table needs its own presets

### 2.2 Default Preset

- User can mark ONE preset as "default" per context
- Default preset auto-applies when the page loads
- If no default, page loads with no filters (normal view)

### 2.3 Custom State

When a preset is applied and the user modifies any filter:
- UI should show "Custom" or "(modified)" state
- User can then: **Save As** (new preset) or **Overwrite** (update existing)

---

## 3. Building Context Keys

### 3.1 conceptKey

The `conceptKey` identifies WHAT kind of data the list shows.

**For Static Pages (hardcoded lists):**

| Page | conceptKey |
|------|------------|
| Admin > Companies | `"companies"` |
| Admin > Admins | `"admins"` |
| Admin > Properties | `"properties"` |
| Client > Users | `"users"` |

**For Dynamic CRM Object Pages:**

Use the pattern: `"crm:{objectApiName}"` or `"crm:{objectTypeId}"`

| Object Type | conceptKey |
|-------------|------------|
| Contacts | `"crm:contacts"` or `"crm:550e8400-e29b-41d4-a716-446655440000"` |
| Deals | `"crm:deals"` |
| Custom Object | `"crm:{objectTypeId}"` |

**Recommendation:** Use `objectTypeId` (UUID) for dynamic objects because:
- It's stable even if the object is renamed
- API already uses objectTypeId

```typescript
// Example: Building conceptKey for dynamic object
const conceptKey = `crm:${objectTypeId}`;
```

### 3.2 tableId

The `tableId` identifies WHICH table on the page.

**Single table pages:**
```typescript
const tableId = "main";
```

**Multi-table pages (e.g., detail page with related records):**
```typescript
// Main contacts list
const tableId = "main";

// Related deals table on contact detail
const tableId = "related-deals";

// Or use a stable identifier
const tableId = `association:${associationTypeId}`;
```

### 3.3 Building Context - Complete Examples

```typescript
// Static page: Companies list
const context = {
  conceptKey: "companies",
  tableId: "main"
};

// Dynamic page: Contacts list (main view)
const context = {
  conceptKey: `crm:${objectTypeId}`, // e.g., "crm:550e8400-..."
  tableId: "main"
};

// Dynamic page: Related deals on a Contact detail page
const context = {
  conceptKey: `crm:${dealsObjectTypeId}`,
  tableId: `association:${contactToDealsAssociationId}`
};
```

---

## 4. API Endpoints

### 4.1 List Presets for Context

```
GET /filter-presets?conceptKey={conceptKey}&tableId={tableId}
```

**Response:**
```json
{
  "context": {
    "conceptKey": "crm:contacts",
    "tableId": "main"
  },
  "items": [
    {
      "id": "preset-uuid-1",
      "name": "Active Contacts",
      "isDefault": true,
      "filterState": { ... },
      "conceptKey": "crm:contacts",
      "tableId": "main",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "updatedAt": "2025-01-15T10:00:00.000Z"
    },
    {
      "id": "preset-uuid-2",
      "name": "VIP Clients",
      "isDefault": false,
      "filterState": { ... },
      ...
    }
  ],
  "limit": 50
}
```

**Notes:**
- Items are sorted: default first, then alphabetically by name
- Max 50 presets per context

---

### 4.2 Create Preset

```
POST /filter-presets
Content-Type: application/json

{
  "conceptKey": "crm:contacts",
  "tableId": "main",
  "name": "Active Contacts",
  "isDefault": false,
  "filterState": {
    "version": 1,
    "searchText": "john",
    "filters": {
      "status": ["active"],
      "createdAfter": "2025-01-01"
    }
  }
}
```

**Response:** `201 Created` with the created preset

**Errors:**
- `409 Conflict` - Name already exists in this context
- `422 Unprocessable Entity` - 50 preset limit reached

---

### 4.3 Get Preset by ID

```
GET /filter-presets/{id}
```

**Response:** `200 OK` with preset object

**Errors:**
- `404 Not Found` - Preset doesn't exist or doesn't belong to user

---

### 4.4 Update Preset (Overwrite)

```
PATCH /filter-presets/{id}
Content-Type: application/json

{
  "name": "Updated Name",           // optional
  "filterState": { ... },           // optional
  "isDefault": true                 // optional
}
```

**Response:** `200 OK` with updated preset

**Errors:**
- `404 Not Found` - Preset not found
- `409 Conflict` - New name already exists

**Note:** Setting `isDefault: true` automatically clears any previous default in the same context.

---

### 4.5 Delete Preset

```
DELETE /filter-presets/{id}
```

**Response:**
```json
{ "deleted": true }
```

**Note:** If deleted preset was the default, there will be no default for that context until user sets a new one.

---

### 4.6 Clear Default for Context

```
DELETE /filter-presets/default?conceptKey={conceptKey}&tableId={tableId}
```

**Response:**
```json
{ "cleared": true }
```

Use this when user wants to "unset" the default so page loads with no preset.

---

## 5. UI Flow & State Machine

### 5.1 Page Load Flow

```
┌─────────────────────────────────────────────────────────┐
│                      PAGE LOAD                          │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Fetch presets for      │
              │  this context           │
              │  GET /filter-presets    │
              └─────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Any preset with        │──── No ────▶ Load page with
              │  isDefault = true?      │              no filters
              └─────────────────────────┘              (normal view)
                            │
                           Yes
                            │
                            ▼
              ┌─────────────────────────┐
              │  Apply default preset:  │
              │  - Set filter UI values │
              │  - Trigger table fetch  │
              │  - Reset to page 1      │
              └─────────────────────────┘
```

### 5.2 Preset Selection Flow

```
User selects preset from dropdown
              │
              ▼
┌─────────────────────────────────────┐
│  1. Update filter UI controls       │
│  2. Update internal filter state    │
│  3. Trigger table data fetch        │
│  4. Reset pagination to page 1      │
│  5. Mark selected preset as active  │
└─────────────────────────────────────┘
```

### 5.3 Custom State Detection

```typescript
// Pseudocode for detecting "modified" state
const isModified = (currentFilters, selectedPreset) => {
  if (!selectedPreset) return false;

  return !deepEqual(
    currentFilters,
    selectedPreset.filterState
  );
};
```

### 5.4 State Diagram

```
                    ┌──────────────┐
                    │   NO PRESET  │ ◄─── Clear Default
                    │   SELECTED   │ ◄─── Delete selected preset
                    └──────────────┘
                           │
                           │ User selects preset
                           ▼
                    ┌──────────────┐
                    │   PRESET     │
            ┌──────▶│   APPLIED    │◄──────┐
            │       └──────────────┘       │
            │              │               │
   Apply    │              │ User changes  │ Save / Overwrite
   preset   │              │ any filter    │
            │              ▼               │
            │       ┌──────────────┐       │
            └───────│   CUSTOM     │───────┘
                    │  (modified)  │
                    └──────────────┘
                           │
                           │ "Save As"
                           ▼
                    Creates new preset
```

---

## 6. Filter State Structure

### 6.1 Base Structure

```typescript
interface FilterState {
  version: 1;                        // Always 1 for now
  searchText: string | null;         // Global search box value
  filters: StaticFilters | DynamicFilters;
  meta?: {
    createdFrom?: string;            // Optional tracking
  };
}
```

### 6.2 Static Filters (for hardcoded pages)

Use a simple key-value object where keys match your filter field names:

```typescript
// Example: Companies list filters
const filterState: FilterState = {
  version: 1,
  searchText: "acme",
  filters: {
    status: ["active", "pending"],   // multi-select
    state: "IL",                     // single select
    createdAfter: "2025-01-01",      // date
    hasDeals: true                   // boolean
  }
};
```

### 6.3 Dynamic Filters (for CRM object pages)

Use the structured format with fieldId references:

```typescript
interface DynamicFilters {
  logic: "AND" | "OR";
  items: DynamicFilterItem[];
}

interface DynamicFilterItem {
  fieldId: string;    // UUID of the CRM field
  op: string;         // Operator: "eq", "neq", "in", "contains", etc.
  value: any;         // Value depends on field type and operator
}
```

**Example:**

```typescript
const filterState: FilterState = {
  version: 1,
  searchText: null,
  filters: {
    logic: "AND",
    items: [
      {
        fieldId: "field-uuid-status",
        op: "in",
        value: ["active", "pending"]
      },
      {
        fieldId: "field-uuid-amount",
        op: "gte",
        value: 10000
      }
    ]
  }
};
```

### 6.4 Supported Operators

| Operator | Meaning | Example Value |
|----------|---------|---------------|
| `eq` | Equals | `"active"` |
| `neq` | Not equals | `"closed"` |
| `in` | In list | `["a", "b", "c"]` |
| `nin` | Not in list | `["x", "y"]` |
| `contains` | Text contains | `"john"` |
| `gt` | Greater than | `100` |
| `gte` | Greater than or equal | `100` |
| `lt` | Less than | `50` |
| `lte` | Less than or equal | `50` |
| `between` | Between range | `[10, 100]` |
| `isNull` | Is null | `true` |
| `isNotNull` | Is not null | `true` |

---

## 7. Integration Checklist

### 7.1 Initial Setup

- [ ] Determine `conceptKey` for each list page in your app
- [ ] Determine `tableId` strategy (usually `"main"` for single-table pages)
- [ ] Create constants/helpers for building context keys

### 7.2 List Page Component

- [ ] On mount: Fetch presets for context
- [ ] On mount: If default preset exists, apply it before fetching data
- [ ] Add preset dropdown/selector to filter panel
- [ ] Show "Default" badge on default preset
- [ ] Show "Custom" / "(modified)" when filters change after preset applied

### 7.3 Preset Actions

- [ ] **Apply:** Update filters + refetch table + reset pagination
- [ ] **Save:** Open modal, collect name, POST to API
- [ ] **Save As:** Same as Save (creates new preset)
- [ ] **Overwrite:** PATCH existing preset with current filters
- [ ] **Delete:** Confirm modal, DELETE preset
- [ ] **Set Default:** PATCH with `isDefault: true`
- [ ] **Clear Default:** DELETE `/filter-presets/default`

### 7.4 State Persistence

- [ ] Track which preset is currently selected
- [ ] Track if current filters differ from selected preset (= custom state)
- [ ] On successful save/overwrite, update local preset list

---

## 8. Common Scenarios

### 8.1 First-Time User (No Presets)

```
1. Page loads → GET presets → empty array
2. Show empty state: "No saved presets" or just hide dropdown
3. User applies filters manually
4. Show "Save Preset" button
5. User saves → preset appears in dropdown
```

### 8.2 User with Default Preset

```
1. Page loads → GET presets → finds preset with isDefault=true
2. Immediately apply that preset's filterState to UI
3. Fetch table data WITH those filters
4. Preset dropdown shows selected preset with "Default" badge
```

### 8.3 Modifying Filters After Preset Applied

```
1. Preset "Active Contacts" is applied
2. User changes status filter from "active" to "pending"
3. Detect: currentFilters !== selectedPreset.filterState
4. Show: "Active Contacts (modified)" or "Custom"
5. Enable: "Overwrite" and "Save As" buttons
```

### 8.4 Dynamic Object Field Deleted

If a preset references a field that no longer exists:

**Backend behavior:** The API will return the preset as-is. The filterState still contains the old fieldId.

**Frontend should:**
1. When applying preset, validate each filter item against current schema
2. Skip/ignore filter items where `fieldId` doesn't match any current field
3. Optionally show warning: "Some filters were skipped (fields no longer exist)"
4. Apply the remaining valid filters

```typescript
// Example: Graceful filter application
const applyPreset = (preset, currentFields) => {
  const validFilters = preset.filterState.filters.items.filter(item =>
    currentFields.some(field => field.id === item.fieldId)
  );

  const skippedCount = preset.filterState.filters.items.length - validFilters.length;

  if (skippedCount > 0) {
    showToast(`${skippedCount} filter(s) skipped - fields no longer exist`);
  }

  applyFilters({
    ...preset.filterState,
    filters: { ...preset.filterState.filters, items: validFilters }
  });
};
```

---

## 9. Error Handling

| Status | Meaning | UI Action |
|--------|---------|-----------|
| `400` | Validation error | Show field errors from response |
| `401` | Not authenticated | Redirect to login |
| `404` | Preset not found | Remove from local list, show toast |
| `409` | Name already exists | Show "Name already taken" on form |
| `422` | Limit reached (50) | Show "Maximum presets reached. Delete some to create new ones." |

**Example error response:**
```json
{
  "statusCode": 409,
  "message": "Preset name already exists in this context",
  "error": "Conflict"
}
```

---

## 10. URL Sync (Optional)

If you want presets to be bookmarkable/shareable:

### 10.1 URL Format

```
/contacts?presetId=550e8400-e29b-41d4-a716-446655440000
```

### 10.2 Flow

```
1. Page loads with ?presetId=xxx
2. Fetch presets for context
3. Find preset with matching ID
4. If found → apply it
5. If not found → ignore (show normal view), optionally show toast
6. Update URL when preset selected
7. Clear URL param when preset deselected
```

### 10.3 Important Notes

- Presets are **private** - sharing URL only works for the same user
- If user A shares URL with user B, user B won't see the preset (404)
- This is mainly for **bookmarking** your own views

---

## Appendix: Quick Reference

### Context Key Patterns

```typescript
// Static pages
const CONCEPT_KEYS = {
  COMPANIES: 'companies',
  ADMINS: 'admins',
  PROPERTIES: 'properties',
  USERS: 'users',
};

// Dynamic CRM objects
const getCrmConceptKey = (objectTypeId: string) => `crm:${objectTypeId}`;

// Table IDs
const TABLE_IDS = {
  MAIN: 'main',
  getAssociationTable: (assocId: string) => `association:${assocId}`,
};
```

### React Hook Skeleton

```typescript
// Conceptual hook structure (implement as needed)
const useFilterPresets = (conceptKey: string, tableId: string) => {
  const [presets, setPresets] = useState([]);
  const [selectedPreset, setSelectedPreset] = useState(null);
  const [isModified, setIsModified] = useState(false);

  // Load presets on mount
  // Apply default on load
  // Track modifications
  // CRUD operations

  return {
    presets,
    selectedPreset,
    isModified,
    defaultPreset: presets.find(p => p.isDefault),
    applyPreset,
    savePreset,
    overwritePreset,
    deletePreset,
    setAsDefault,
    clearDefault,
  };
};
```

---

## Questions?

If you need clarification on:
- How to structure `conceptKey` for a specific page
- How to handle a specific UI state
- How to map your existing filter format to `FilterState`

Reach out to the backend team.
