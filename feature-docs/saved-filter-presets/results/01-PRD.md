# PRD — Saved Filter Presets (Filters-only)

> **Feature folder:** `docs/features/saved-filter-presets/`  
> **File:** `prd.md`  
> **Status:** Draft (ready for spec.md)

---

## 1) Goal / Problem Statement

Today, when a user applies filters on any list page (tables) and refreshes or comes back later, the filters reset to the page’s default state. Users repeatedly recreate the same filter combinations (e.g., “Active admins”, “Illinois companies”), which wastes time and increases inconsistency.

This feature adds **Saved Filter Presets** so users can:

- save a named set of filters for a specific list/table
- quickly re-apply it later
- optionally set one preset as **default**, so it auto-applies whenever they open that page/table

**Important:** This is **filters-only** (no columns, no sort, no layout).

---

## 2) Users & Roles

- **Admin users:** use admin-side list pages (e.g., Admin > Companies, Admin > Admin Users).
- **Client users:** use client-side list pages, including **dynamic objects** (object types + fields vary by tenant).

**Tenant isolation:** presets must never cross `companyId`.  
**Ownership:** presets are **per-user (private)**.

---

## 3) User Stories

1) As a user, I can apply filters on a list page and **save them as a named preset**.  
2) As a user, I can **see a list/dropdown** of my saved presets for this page/table and select one to apply it.  
3) As a user, I can mark a preset as **Default** so it **auto-applies** when I open the page/table later.  
4) As a user, I can **remove the default** so the page/table opens in **normal view** (no filters selected).  
5) As a user, I can **overwrite** an existing preset (updating **name + filters**) when my requirements change.  
6) As a user, I can **delete** a preset.  
7) As a user on a **dynamic object list**, I can apply a saved preset even if some fields changed; missing/invalid field filters are **ignored** and the rest still applies.  
8) As a user, I can bookmark/share a URL that includes a `presetId` so opening that URL applies the preset (for myself).

---

## 4) In Scope (MVP)

### Scope / Context
- Presets are scoped to **context = `conceptKey + tableId`** (plus tenant + user behind the scenes).
- Works on **Admin + Client** sides.
- Works on **Static pages + Dynamic object pages**.
- Presets are **private per user**.

### Preset operations
- Create (save current filters)
- Apply
- Set default
- Clear default (return to normal view)
- Overwrite existing preset (**name + filters**)
- Delete

### Apply behavior
- Applying a preset:
  - updates filter UI controls
  - reloads table results
  - resets pagination to **page 1 / offset 0**
- Filter state includes **search text**.
- URL support: **`presetId` in URL** (no raw filter query params).
- Dynamic schema changes: if preset references missing/changed fields → **ignore those filters**.

### Limits & naming
- Up to **50 presets** per user per context.
- Preset names must be **unique per context**.

---

## 5) Out of Scope

- Column visibility/order
- Sorting
- Table layout
- “Saved Views” combining filters + columns + sorting
- Shared/team presets
- Presets that work across multiple pages/tables
- Export/import of presets

---

## 6) UX Flow (Screens + States)

### A) List page initial load
**Case 1: No default preset**
- Page loads with normal view (no filters selected).
- Preset control shows:
  - empty state or “No preset selected”
  - CTA: “Save preset” (behavior TBD: always enabled vs enabled after filter changes)

**Case 2: Default preset exists**
- Page loads
- Default preset auto-applies:
  - filter UI updates to match preset
  - table fetch runs with preset filters
  - pagination resets to page 1

### B) Saving a new preset
- User sets filters + search
- Click “Save preset”
- Enter preset name
- Option: “Set as default” (checkbox)
- Save → preset appears in dropdown, becomes selected

### C) Applying a preset
- User selects a preset
- UI updates filter controls
- Table reloads
- Pagination resets to page 1

### D) Custom state
- If a preset is selected and user changes any filter/search:
  - show state “Custom” (not matching saved preset)
  - allow:
    - “Overwrite selected preset” (updates name + filters)
    - “Save as new preset”

### E) Overwrite vs Save As
- Overwrite:
  - (optional) confirmation step
  - updates preset name + filters
- Save As:
  - creates new preset with a new unique name

### F) Setting/changing default
- On a selected preset, user clicks “Make default”
- Default indicator shows in UI
- Changing default switches it to another preset
- “Clear default” removes default and returns to normal view on next page load

### G) Deleting a preset
- User deletes preset
- If deleted preset was default:
  - default becomes cleared
  - page returns to normal view next load (exact timing TBD)

### H) Dynamic object behavior (unknown fields)
- While applying a preset:
  - if some filters reference fields that don’t exist anymore or changed type → ignore those filters
  - apply the rest
- Optional: show a non-blocking warning like “Some filters were skipped” (TBD)

---

## 7) Acceptance Criteria (Testable Checklist)

- [ ] User can create a preset from current filters/search and it persists after reload.
- [ ] Preset list is scoped correctly by:
  - [ ] tenant/company
  - [ ] user
  - [ ] context (conceptKey + tableId)
- [ ] Preset names are unique per context (cannot create duplicates).
- [ ] User can apply a preset and:
  - [ ] UI filters match
  - [ ] table reloads
  - [ ] pagination resets to page 1
- [ ] Default preset auto-applies on page open.
- [ ] User can clear default and page opens with normal view (no filters selected).
- [ ] User can overwrite a preset (updates name + filters).
- [ ] User can delete a preset.
- [ ] Dynamic object field changes do not break applying presets:
  - [ ] missing/invalid field filters are ignored
  - [ ] the rest applies
- [ ] URL with `presetId` applies the preset (at least for the owner user).
- [ ] Max 50 presets per context enforced.

---

## 8) Non-Functional Requirements

### Security / Permissions
- Presets are private per user.
- Hard tenant isolation by `companyId`.
- A user cannot read/modify another user’s presets (even in same tenant), unless explicitly added later (out of scope).
- Applying a preset must not bypass existing RBAC rules for data access.

### Performance
- No noticeable slowdown on list page load.
- Applying preset should feel instant (exact p95 target TBD).

### Audit / Logging
- Log preset create/update(overwrite)/delete/default-set/default-cleared events (where/how TBD).

---

## 9) Analytics / Telemetry

Track events (at minimum):
- `preset_created`
- `preset_applied`
- `preset_overwritten`
- `preset_deleted`
- `preset_default_set`
- `preset_default_cleared`
- `preset_apply_skipped_filters` (when dynamic fields are missing)

---

## Open Questions (to finalize PRD)

1) **conceptKey ownership:** who defines conceptKey mapping (hardcoded per page, config table, or derived)? Especially for dynamic objects: is conceptKey just `objectApiName`, or something else?
2) **URL sharing reality:** since presets are private per user, is URL “sharing” mainly for **bookmarking for yourself**, not sharing with other users?
3) **Multiple tables on one page:** do you already have a stable `tableId` everywhere, or do we need to introduce/standardize it?
4) **Delete default behavior:** if user deletes the default preset, should the UI immediately switch to normal view, or only on next reload?
5) **Skipped filters warning:** when we ignore missing dynamic-field filters, do you want a small warning (“some filters skipped”) or totally silent?
6) **Confirm overwrite:** do you want a confirmation modal for overwrite (to prevent accidental overwrites), or is one-click overwrite OK?
