# Context Pack — Saved Filter Presets (Filters-Only)

> Save as: `docs/features/saved-filter-presets/context.md`  
> This context pack is written for building a PRD + spec for **Saved Filter Presets** on list/table pages.

---

## Product Context (Pre-filled for this repo)

- **Product:** CRM SaaS with **static list pages** and **dynamic object list pages** (clients can create custom object types and fields).
- **Surfaces:** Admin (`src/api/admin/`) and Client (`src/api/client/`)
- **Tenancy Key:** `companyId` (tenant/workspace isolation). Presets must never cross companies.
- **Roles:**
  - **Admin User:** Platform/admin-side users (manage companies, admins, global config, etc.)
  - **Client User:** Company users (manage their company’s CRM data + custom objects)

---

## Feature Context

- **Feature Name:** Saved Filter Presets (Filters-only)
- **Applies To:**  
  - **Static pages** (hardcoded), e.g. Admin > Companies, Admin > Admin Users  
  - **Dynamic object pages** (unknown schema ahead of time), e.g. Realtors, Properties, Moving Companies, etc.
  - Works on **both Admin and Client** surfaces.

### Current Behavior
- On any list page, a user can apply filters (status, state, etc.), but **filters reset** when the user reloads the page or returns later.
- Users must re-create the same filter combinations repeatedly.

### Desired Behavior
- Users can **save the current filter state** as a named preset/template.
- Users can **apply a saved preset** later from a dropdown (or similar).
- Users can mark **one preset as the default** per “context” so it auto-applies when the page opens.
- Users can **clear/unset the default** so the page opens with “no preset / default system view”.
- Presets are **per-user (private)** and **tenant-safe** (company isolated).

### Example User Journeys (Happy Path)
1) Admin user opens **Admin > Companies**, filters `state=IL`, clicks “Save preset”, names it “Illinois Companies”, sets it as default. Next time they open the page, it auto-loads with `state=IL`.
2) Client user opens a **dynamic object list** (e.g. Realtors), filters `status=active`, saves preset “Active Realtors”, later switches back to “All Realtors” by clearing filters or selecting another preset.

---

## Scope

- **In Scope (MVP):**
  - Save current filters as a **named preset** for a specific list page context.
  - List/select presets per context (dropdown).
  - Set/unset **default preset** per context (auto-apply on page open).
  - Rename preset.
  - Delete preset.
  - Applying a preset must:
    - update filter UI controls (chips/inputs)
    - re-fetch/reload the table results
  - Works on:
    - Admin surface + Client surface
    - Static pages + Dynamic object pages

- **Out of Scope (v1):**
  - Column visibility/order, sorting, table layout, “saved views” (filters+columns+sort combined)
  - Shared/team presets (presets are private per user)
  - Cross-page presets (one preset applied to multiple pages)
  - Anything that changes table schema or dynamic fields definitions
  - Advanced permission workflows for sharing/editing presets across users

---

## Data & Domain

- **Entities Involved (existing):**
  - `User` (who owns presets)
  - `Company`/tenant (`companyId`)
  - Dynamic object system (object types + fields) for dynamic pages

- **New Entities Needed (conceptual):**
  - `SavedFilterPreset` (or similar) to store:
    - ownership (`userId`, `companyId`)
    - scope/context (where this preset applies)
    - name + metadata
    - filter state payload (JSON)

- **Key Identifiers (conceptual):**
  - `companyId`, `userId`
  - `surface`: `"admin"` | `"client"`
  - **Context key** parts (TBD exact model):
    - `pageKey` for static pages (ex: `"admin/companies"`)
    - `objectTypeKey` / `objectApiName` for dynamic object pages (ex: `"realtors"`)
    - optional `tableId` / `viewId` if a page can contain multiple independent tables
  - `presetId`

- **Filter State Payload (conceptual):**
  - Should store **only filters**, e.g.:
    - search string
    - dropdown selections
    - multi-select
    - booleans
    - date ranges
    - numeric ranges
  - Must work for dynamic object fields where filter definitions can change.

---

## UX Context

- **Screens/Pages:**
  - Any list page that has:
    - a table
    - filter controls (chips/inputs)
  - Includes both static pages and dynamic object list pages (admin + client).

- **UI States (minimum):**
  - **Empty presets state:** user has no presets for this context (show “Save preset” CTA).
  - **Has presets:** show preset dropdown + actions (save, rename, delete, set default).
  - **Default applied:** on load, default preset auto-applies (user can see which preset is active).
  - **Custom state:** user modifies filters after applying a preset; indicate “Custom” until they save/overwrite.
  - **Loading:** applying preset shows loading state while table reloads.
  - **Error:** if preset fails to apply (invalid payload, server error), show error and fall back safely (TBD behavior).

- **Interaction Rules (important):**
  - Presets change **only filter state**.
  - Applying a preset must update both:
    - filter UI controls
    - table results (refetch)
  - Presets are **per user** (no other users see them).
  - Presets are scoped to a **context key** (page/object/table) and do not bleed across contexts.

---

## Technical Context (Pre-filled)

- **Admin Modules:** `src/api/admin/companies/`, `src/api/admin/templates/`, `src/api/admin/properties/`
- **Client Modules:** `src/api/client/object-related/crm-object/`, `src/api/client/auth2/`
- **Entities Location:** `src/api/entities/`
- **Repositories Location:** `src/api/repositories/postgres/`
- **Auth Pattern:** JWT guards, `@CurrentUser()` decorator, `CompanyContext` for tenant resolution
- **Similar Features to Reference:** TBD (user preferences / templates / saved settings patterns)

---

## Non-Functional Requirements

- **Performance:** no noticeable slowdown on list page load; applying a preset should feel instant (target p95 TBD).
- **Security:**
  - tenant isolation via `companyId`
  - presets are private to the owning `userId` (unless we later add “shared presets”)
- **Limits (TBD):**
  - max presets per user per context (suggest 20–50)
  - max payload size for filter JSON
  - naming rules (length, uniqueness per context)

---

## Decisions Locked (confirmed)

- **Scope:** `pageKey + tableId` (a page can have multiple tables; presets are scoped to both)
- **Admin vs Client:** presets are **shared when the page is the same concept** using a shared `conceptKey` (even across surfaces)
- **Default preset:** if set, it **auto-applies** on page open; clearing default returns to **normal view (no filters selected)**
- **Search included:** **Yes** (search box text is part of filter state)
- **Pagination:** applying a preset resets to **page 1 / offset 0**
- **URL sync/share:** **Yes** (filters/preset selection may be reflected in URL for bookmarking/sharing)
- **Dynamic field changes:** if a filter references a deleted/changed dynamic field → **ignore that filter** (do not fail)
- **Save behavior:** support **Overwrite existing preset** (in addition to Save New)
- **Naming:** preset names must be **unique per context** (context = conceptKey + tableId + tenant + user)
- **Limit:** up to **50 presets** per user per context

- **Concept sharing across surfaces:** use a separate **`conceptKey`** (not pageKey) to define “same concept” shared presets across Admin + Client
- **URL sync format:** URL uses **`presetId` only** (no raw filters in query params)
- **Overwrite behavior:** overwrite updates **both name and filters** (full preset update)
---
