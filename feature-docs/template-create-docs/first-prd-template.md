# Feature Folder Docs Convention (PRD + Spec)

You want **two files** per feature, with **static filenames**, stored inside a **feature folder**.

## Recommended folder layout

```
docs/features/[feature-slug]/
  prd.md        # Product Requirements (what/why)
  spec.md       # Engineering “source of truth” (how): entities, DTOs, APIs, rules, tests
  context.md    # (optional) Context pack used for AI prompts
```

- **`[feature-slug]` is the folder name**, e.g. `saved-filter-presets`
- Filenames are always the same: **`prd.md`** and **`spec.md`**
- This makes it easy to find docs, link between them, and automate prompts.

---

# How prompts should reference files

## Paths (replace `[feature-slug]`)

- PRD path:
  - `docs/features/[feature-slug]/prd.md`

- Spec path (source of truth):
  - `docs/features/[feature-slug]/spec.md`

- Optional Context pack:
  - `docs/features/[feature-slug]/context.md`

---

# PRD (what/why) workflow

## PRD Phase 1 prompt (analysis + questions first)

```txt
You are a senior product manager + backend architect.

Feature folder: docs/features/[feature-slug]/
Inputs:
- Context Pack (if exists): docs/features/[feature-slug]/context.md

TASK — PHASE 1 ONLY (no PRD yet):
1) Summarize the feature in your own words (1–2 paragraphs).
2) List key decisions we must lock (scope keys, defaults, permissions, limits, dynamic object concerns).
3) List major edge cases/risks.
4) Ask ONLY the questions needed to remove ambiguity (min 3, max 8).

STOP after PHASE 1 and wait for my answers.

[PASTE CONTEXT PACK IF NEEDED]
```

## PRD Phase 2 prompt (generate `prd.md`)

```txt
Now write PRD v1.0 for this feature.

Output file: docs/features/[feature-slug]/prd.md

PRD must include:
1) Goal / Problem Statement
2) Users & Roles
3) User Stories
4) In Scope (MVP)
5) Out of Scope
6) UX Flow (screens + states)
7) Acceptance Criteria (testable checklist)
8) Non-Functional Requirements (security/perf/audit)
9) Analytics/Telemetry (events)

Rules:
- Do NOT write endpoints, DB schema, DTOs, or implementation steps.
- Keep it product requirements + UX behavior only.

Use only:
- context.md (if provided)
- my answers to your questions

[PASTE Q&A]
```

---

# Spec (how) workflow (source of truth)

## Spec file rule
- `spec.md` must **always link back to prd.md**
- `spec.md` is allowed to contain engineering detail:
  - entities/tables, indexes, constraints
  - endpoint contract + examples
  - DTO shapes + validation rules
  - service rules/invariants
  - error mapping
  - tests and QA checklist

## Spec builder prompt (create/update `spec.md`)

```txt
You are my product+engineering spec writer.

Inputs:
- PRD: docs/features/[feature-slug]/prd.md
- Context Pack (optional): docs/features/[feature-slug]/context.md
- Repo conventions: scan the repo to learn tenant key, auth guards, DTO style, error shape, pagination.

Task:
Create or update:
- docs/features/[feature-slug]/spec.md

Spec must include:
1) Overview + links (link to prd.md)
2) Roles & Permissions (RBAC)
3) Scope/Context rules (how to scope this feature)
4) Data model design (entities, constraints, indexes)
5) API contract (endpoints + request/response examples)
6) DTO contract + validation rules + Swagger notes (avoid any[])
7) Service/business rules (MUST/SHOULD)
8) Error model (401/403/404/409/422)
9) Logging/audit events
10) Performance & limits
11) Testing matrix + regression risks
12) Manual QA checklist (Scalar)
13) Migration/rollout notes + rollback
14) Open questions / decisions log
15) Definition of Done

Rules:
- DO NOT write application code.
- DO NOT invent facts; if missing, mark as TBD and add it to “Open questions”.
Output:
- The full markdown content for spec.md
```

---

# Implementation order (after spec.md is frozen)

Implement in small steps (each task is independent):
1) DB/entities/migrations
2) DTOs + validation + Swagger
3) Service logic
4) Controllers/routes
5) Tests
6) Manual QA docs
7) Done checklist + release notes

Tip: keep each Codex run focused on **one task** and limit which folders/files it can touch.

