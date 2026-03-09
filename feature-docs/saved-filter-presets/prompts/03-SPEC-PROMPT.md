# 03-SPEC-PROMPT — Saved Filter Presets (Filters-only)

Use this prompt to generate the **engineering “Living Spec”** (how) for the feature, based on the already-approved context + PRD.

> **Input files (already created):**
> - `docs/features/saved-filter-presets/context.md` (or `saved-filter-presets_context_v3.md`)
> - `docs/features/saved-filter-presets/prd.md` (or `saved-filter-presets_prd.md`)
>
> **Output file (create/update):**
> - `docs/features/saved-filter-presets/spec.md`

---

## Prompt A — Generate / Update `spec.md` (NO CODE)

```txt
You are a senior backend architect + product engineer.

Feature: Saved Filter Presets (filters-only)
Folder: docs/features/saved-filter-presets/

Inputs (use ONLY these):
- Context: docs/features/saved-filter-presets/context.md
- PRD: docs/features/saved-filter-presets/prd.md
- Repo conventions: scan the repository to align with existing patterns (auth, companyId/tenant isolation, DTO style, error shape, pagination, module structure).
  - Do NOT invent conventions. If unclear, mark as TBD.

TASK:
Create or update: docs/features/saved-filter-presets/spec.md

IMPORTANT FIXED DECISIONS (must be reflected in the spec):
- Scope key: **conceptKey + tableId**
- Presets are **per-user (private)** and tenant-safe via **companyId**
- Shared across admin/client when using the same **conceptKey**
- Default preset: if set, **auto-applies** on page open; clearing default returns to **normal view (no filters selected)**
- Filter state includes **search text**
- Apply preset resets pagination to **page 1 / offset 0**
- URL format: **presetId only** (no raw filters in query params)
- Dynamic fields: if a filter references a missing/changed field → **ignore that filter** (do not fail apply)
- Actions include **overwrite** (updates name + filters)
- Names are **unique per context**; limit **50 presets per context**

SPEC STRUCTURE (use these headings exactly):
1) Overview
   - Purpose
   - Links (context.md, prd.md, designs if any)
2) Terminology
   - conceptKey, tableId, context, preset, default, “Custom” state
3) Scope Key & Context Rules (source of truth)
   - exact definition of a “context”
   - how admin+client sharing works via conceptKey
4) Data Model Design (no code, but precise)
   - entities/tables/relations
   - required fields (types + meaning)
   - constraints (uniqueness, default rules)
   - indexes
   - payload storage strategy for filters/search
5) API Contract (write endpoints + examples)
   - CRUD presets scoped to current user/company
   - list presets by (conceptKey, tableId)
   - apply behavior
   - default set/clear
   - overwrite vs save-as
   - URL presetId behavior
   - status codes & error model
6) DTO Contract + Validation Rules (contract-level, no code)
   - request/response shapes
   - field requirements
   - validation & sanitization rules
   - Swagger notes to avoid any[] in generated types
7) Business Rules (MUST/SHOULD)
   - default precedence
   - merge rules if request includes filters + presetId
   - how “Custom” is determined (backend vs frontend)
8) Error Model & Edge Cases
   - 401/403/404/409/422 mapping
   - name conflicts, limit exceeded, missing preset, cross-tenant access
   - dynamic fields ignored behavior
9) Logging / Audit
   - events + metadata fields to log
10) Performance & Limits
    - targets
    - max presets, payload size considerations
11) Testing Matrix
    - per-endpoint test cases (happy path, auth, tenant isolation, conflicts)
    - regression risks
12) Manual QA Checklist (Scalar-friendly)
    - step-by-step checks
13) Migration / Rollout Notes
    - backward compatibility notes
    - rollout plan
    - rollback plan
14) Open Questions / TBDs
    - anything uncertain must be listed here

RULES:
- Do NOT write application code.
- Do NOT write migrations/SQL, but describe them clearly.
- Do NOT invent unknown repo details; mark TBD and add to “Open Questions”.
- Keep admin/client + static/dynamic behavior explicit.
- Use JSON examples where helpful.

OUTPUT:
- Output the full markdown content for docs/features/saved-filter-presets/spec.md (and nothing else).
```

---

## Prompt B — Turn `spec.md` into “Sticky Note” Tasks (small, 30–90 min each)

```txt
You are a senior engineering manager.

Inputs:
- docs/features/saved-filter-presets/spec.md

TASK:
Create a task breakdown as markdown that can be pasted into Notion.

Rules:
- Each task must be 30–90 minutes.
- Each task has:
  - Title
  - Goal
  - Files to touch (explicit)
  - Implementation steps (bullets)
  - Verification steps (commands + what to check)
  - Definition of Done
- Order tasks to minimize rework:
  1) data model + migration
  2) repository/service layer
  3) endpoints + DTOs + Swagger
  4) integration into list endpoints (apply default/presetId)
  5) tests
  6) docs / QA checklist updates

Output:
- A single markdown document named: docs/features/saved-filter-presets/tasks.md
```

---

## Prompt C — Codex Implementation Runs (1 run = 1 task)

> Use this when you want Codex to actually implement code for a single task from `tasks.md`.

```txt
You are OpenAI Codex working inside this repository.

Feature folder: docs/features/saved-filter-presets/
Source of truth:
- spec.md (engineering rules)
- tasks.md (the task you are implementing)

TASK:
Implement ONLY this task:
[TASK TITLE HERE]

Constraints:
- Touch only the files listed in the selected task card.
- If you must touch another file, STOP and explain why before editing.
- After changes: run the verification commands from the task card.
- Output a short summary of what changed + what commands you ran + results.

Start by:
1) Opening spec.md and tasks.md
2) Locating the task card
3) Listing the exact files you will edit
4) Then implement
```

---

## Prompt D — “Explain the Codebase” (quick repo orientation)

```txt
Scan this repository and explain the architecture briefly:
- key modules and how admin vs client APIs are separated
- where entities and repositories live
- how companyId (tenant) is resolved
- how auth guards/decorators work (user vs admin)
- how list endpoints handle filters/pagination today

Keep it to 15–25 bullets max.
Cite specific folders/files you used to infer the architecture.
```
