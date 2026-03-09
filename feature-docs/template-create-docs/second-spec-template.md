# Reusable Feature Workflow (Folder-Based: prd.md + spec.md)

This workflow standardizes docs for every feature using **one feature folder**:

```
docs/features/[feature-slug]/
  prd.md     # what/why
  spec.md    # how (entities/DTOs/APIs/rules/tests)
  context.md # optional
```

---

## 1) Build a Context Pack (optional but strongly recommended)

Create: `docs/features/[feature-slug]/context.md`

Include:
- Product/module context (CRM SaaS, admin/client, tenancy model)
- Current behavior vs desired behavior
- Roles/RBAC expectations
- Screens + UX states
- Data/domain terms and IDs (tenantId, userId, objectApiName, pageKey/tableId)
- Repo conventions (auth guards, pagination, error shape, Swagger generation)

---

## 2) PRD workflow (prd.md)

### Phase 1 — Analysis + questions (no PRD yet)
Prompt (Claude/ChatGPT/Codex):

```txt
You are a senior product manager + backend architect.

Feature folder: docs/features/[feature-slug]/
Inputs:
- context.md (if exists)

TASK — PHASE 1 ONLY:
1) Summarize the feature in your own words.
2) List decisions to lock (scope keys, defaults, permissions, limits, dynamic schema concerns).
3) List edge cases/risks.
4) Ask only the questions needed (min 3, max 8).
Stop and wait for my answers.
```

### Phase 2 — Generate PRD v1.0 (write prd.md)
```txt
Write PRD v1.0 and output ONLY the file contents for:
docs/features/[feature-slug]/prd.md

Must include:
- Goal/problem
- Users/roles
- User stories
- In-scope/out-of-scope
- UX flow (screens + states)
- Acceptance criteria
- NFRs (security/perf/audit)
- Telemetry events
Rules: no endpoints/DB/DTOs/implementation.
```

---

## 3) Living Spec workflow (spec.md = engineering source of truth)

### Build/update spec.md (no code)
```txt
You are my product+engineering spec writer.

Inputs:
- PRD: docs/features/[feature-slug]/prd.md
- context.md (optional)
- Scan repo conventions (tenant key, auth guards, DTO style, error shape, pagination).

Task:
Create/update docs/features/[feature-slug]/spec.md with:
1) Overview + link to prd.md
2) RBAC rules
3) Scope/context key rules
4) Data model (entities, constraints, indexes)
5) API contract (endpoints + examples)
6) DTO contract + validation + Swagger notes (avoid any[])
7) Service rules (MUST/SHOULD)
8) Error mapping
9) Logging/audit
10) Performance/limits
11) Testing matrix + regression risks
12) Manual QA (Scalar)
13) Rollout/rollback notes
14) Open questions / decisions log
15) Definition of Done

Rules:
- No application code.
- No guessing; use TBD + open questions.
Output only the markdown file content for spec.md.
```

---

## 4) Implementation tasks (after spec.md is frozen)

Order:
1) Entities + migrations
2) DTOs + validation + Swagger
3) Service logic
4) Controllers/routes
5) Tests
6) Manual QA docs
7) Done checklist

Tip: each Codex run = one task, strict “allowed files” rule.
