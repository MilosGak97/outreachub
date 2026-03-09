# 02-UX-PROMPT — Saved Filter Presets (Filters-only)

Use this prompt to generate the **UX doc** for the feature (screens, states, interactions).  
This happens **after PRD** and **before spec/implementation**.

> **Inputs (already created):**
> - `docs/features/saved-filter-presets/context.md` (or `saved-filter-presets_context_v3.md`)
> - `docs/features/saved-filter-presets/prd.md` (or `saved-filter-presets_prd.md`)
>
> **Output file (create/update):**
> - `docs/features/saved-filter-presets/ux.md`

---

## Fixed UX Decisions (locked)
- Preset control lives **inside the Filter Panel** (not top bar).
- Saving/overwriting uses a **modal**.
- After a preset is applied, if user changes any filter/search → show **“Custom”** state + actions **Save As** and **Overwrite**.
- If applying preset ignores missing dynamic fields → **silent** (no toast/warning).

---

## Prompt — Generate / Update `ux.md` (NO API / NO DB / NO CODE)

```txt
You are a senior product designer + UX writer for a CRM SaaS.

Feature: Saved Filter Presets (filters-only)
Folder: docs/features/saved-filter-presets/

Inputs (use ONLY these):
- Context: docs/features/saved-filter-presets/context.md
- PRD: docs/features/saved-filter-presets/prd.md

TASK:
Create or update: docs/features/saved-filter-presets/ux.md

CRITICAL RULES:
- UX doc ONLY. Do NOT write endpoints, DB schema, DTOs, or implementation steps.
- Do NOT invent product facts. If missing, mark as TBD and list in “Open UX Questions”.
- This feature is FILTERS ONLY: no columns, no sorting, no layout.

MUST REFLECT THESE PRODUCT DECISIONS:
- Scope key: **conceptKey + tableId** (presets scoped to this, plus tenant + user)
- Presets are **per-user private**
- Shared across admin/client when using same **conceptKey**
- Default preset: if set, **auto-applies** on page open; clearing default returns to **normal view (no filters selected)**
- Filter state includes **search text**
- Applying preset resets pagination to **page 1 / offset 0**
- URL format: **presetId only** (no raw filters)
- Dynamic fields: missing/changed filters are **ignored silently**
- Actions include **overwrite** (updates name + filters)
- Names unique per context; limit **50 per context**
- Preset selector/control is **inside the Filter Panel**
- Save/Overwrite uses a **modal**
- “Custom” state shown after filter changes (Save As / Overwrite)

OUTPUT STRUCTURE (use these headings exactly):

1) Overview
   - What problem this UX solves
   - Where it appears (Admin + Client, static + dynamic lists)
2) Components
   - Filter Panel location + sections
   - Preset Selector UI (dropdown/list)
   - Buttons (Apply, Save Preset, Save As, Overwrite, Delete, Make Default, Clear Default, Reset Filters)
   - Labels/Badges (Default, Custom)
3) States
   - No presets yet (empty)
   - Has presets, no default
   - Has default preset (auto-applies on load)
   - Preset selected
   - Custom (modified after preset)
   - Loading states (apply preset, save, delete)
   - Error states (name conflict, limit reached, not found, unauthorized)
4) Primary Flows (step-by-step)
   A) First time user (no presets)
   B) Save new preset (modal details)
   C) Apply preset (what changes, when table reloads)
   D) Set as default / change default
   E) Clear default (return to normal view)
   F) Custom state behavior (after filter changes)
   G) Overwrite preset (modal + confirmation rules)
   H) Save As new preset (modal)
   I) Delete preset (confirmation)
   J) Reset filters (interaction with preset selection)
5) Modal Specs
   - Save Preset modal fields (Name, Set as default checkbox)
   - Overwrite modal fields (Name editable; clarifies it updates name + filters)
   - Save As modal (Name, Set as default checkbox)
   - Delete confirmation modal
   - Validation messages (unique name, empty name behavior, limit 50)
6) Interaction Rules (source of truth)
   - Precedence rules: presetId in URL vs default vs normal view
   - What exactly is included in “filter state” (search, chips, ranges, selects)
   - Pagination reset rule
   - “Custom” determination rule (what counts as a change)
   - How “no filters selected” is represented in UI
   - Handling missing dynamic fields (silent ignore)
   - If preset deleted while selected/defaulted, resulting UI state
7) Accessibility & Usability
   - Keyboard navigation for dropdown
   - Screen reader labels for preset state
   - Clear affordances for Default vs Custom
8) Analytics (UX-visible points)
   - When events trigger (apply, save, overwrite, delete, default set/clear)
9) Open UX Questions / TBD
   - Only UX-level unknowns that require product decision

DELIVERABLE:
- Output the full markdown content for docs/features/saved-filter-presets/ux.md (and nothing else).
```

---

## Optional Prompt — Quick Wireframe (text-only)

Use this if you want a fast “layout sketch” to hand to your React dev.

```txt
Based on the same PRD/context, create a text-only wireframe for the Filter Panel:
- where the Preset selector sits
- button placement
- how Default + Custom appear
- modal field layouts
Keep it concise, but concrete.
```
