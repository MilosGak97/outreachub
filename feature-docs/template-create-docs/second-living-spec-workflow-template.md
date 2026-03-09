# Living Spec Workflow Template (Reusable for Any Feature)

This document is a reusable workflow for creating a **single “Living Spec” markdown file** per feature, and filling it step-by-step using **Codex** prompts (spec-only first, then code later).

> **Goal:** One source-of-truth file that drives everything: **entities → DTOs → endpoints → service rules → tests → done**.

---

## Recommended Living Spec File

**Path pattern**
- `docs/impl/[feature-slug].md`

**Sections inside**
1. **Overview + links** (PRD, designs)
2. **Roles & Permissions (RBAC)**
3. **Scope Key / Context** (if feature depends on page/object)
4. **Data model changes** (entities/tables/relations)
5. **API contract** (endpoints + examples)
6. **DTOs & validation rules**
7. **Service/business rules** (state changes, dedupe, limits)
8. **Error model** (401/403/404/409/422)
9. **Logging & audit**
10. **Performance & limits**
11. **Testing matrix** (unit/integration)
12. **Manual QA checklist (Scalar)**
13. **Migration/Rollout notes**
14. **Open questions / decisions log**
15. **Definition of Done**

---

# Codex Prompt Pack (Run in Order, Every Feature)

Replace:
- `[FEATURE_NAME]`
- `[feature-slug]`
- `[PRD_PATH]`

> **Important:** Prompts 0–8 are **SPEC ONLY** (no app code).  
> After the living spec is complete/frozen, you start implementation tasks (entities → DTOs → services → controllers → tests).

---

## Prompt 0 — Create/Reset the living spec skeleton (SPEC ONLY)

```txt
FEATURE: [FEATURE_NAME]
PRD: [PRD_PATH]
OUTPUT FILE: docs/impl/[feature-slug]/feature-workflow.md

Task:
1) Read the PRD at [PRD_PATH].
2) Create (or rewrite) docs/impl/[feature-slug]/feature-workflow.md as a living spec skeleton with these headings:
   - Overview (link to PRD + short summary)
   - Roles & Permissions
   - Data Model
   - API Contract
   - DTOs & Validation
   - Service/Business Rules
   - Error Model
   - Logging/Audit
   - Performance/Limits
   - Testing Matrix
   - Manual QA (Scalar)
   - Migration/Rollout Notes
   - Open Questions / Decisions Log
   - Definition of Done
3) Under each heading, add placeholders for what must be decided.
Rules:
- Do NOT write code.
- Do NOT invent details not present in PRD; mark as TBD instead.
Output:
- Only the contents of docs/impl/[feature-slug]/feature-workflow.md
```

---

## Prompt 1 — Repo scan + project conventions (update spec only)

```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md
PRD: [PRD_PATH]

Task:
1) Scan the repository to learn conventions:
   - tenant/workspace key naming (tenantId/companyId/workspaceId)
   - user identity
   - auth guard + RBAC patterns
   - DTO/Swagger patterns
   - error response shape and exception filters
   - pagination/sort patterns
   - module structure (admin vs client APIs)
2) Update docs/impl/[feature-slug].md with a short “Project Conventions” subsection under Overview.
Rules:
- Update the spec only.
- No code changes.
- Be specific (file paths, naming patterns) and avoid guesses.
```

---

## Prompt 2 — Data model design (spec only)

```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md
PRD: [PRD_PATH]

Task:
Design the data model changes required for this feature.
- Propose entities/tables/relations.
- Include required fields, types, and why they exist.
- Include constraints (uniques), indexes, and cardinality.
- Include tenancy rules (how data is isolated).
Update ONLY the “Data Model” section of the spec.

Rules:
- No code.
- If PRD is missing info, add TBD + 3–6 targeted questions in “Open Questions”.
- Keep it aligned to existing repo conventions found earlier.
```

---

## Prompt 3 — API contract design (spec only)

```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md
PRD: [PRD_PATH]

Task:
Define the full API contract:
- Endpoint list (method + path) for admin and/or client surfaces as required.
- Request/response examples (JSON) for each endpoint.
- Pagination/sorting/search (if relevant)
- Status codes and error codes per endpoint
Update ONLY the “API Contract” section of the spec.

Rules:
- No code.
- Follow repo’s existing route naming conventions.
- Do NOT include DB or implementation steps here.
```

---

## Prompt 4 — DTOs + validation rules (spec only)

```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md
PRD: [PRD_PATH]

Task:
Define DTOs as a contract (names + fields + validation rules):
- Request DTOs for each endpoint
- Response DTOs for each endpoint
- Validation rules (required/optional, formats, enums, arrays, nested objects)
- Swagger specifics needed to avoid any[] and unknown object items
Update ONLY the “DTOs & Validation” section of the spec.

Rules:
- No code.
- Keep DTO names consistent with your module naming.
- Include at least 1 example payload per DTO.
```

---

## Prompt 5 — Service/business rules + state machine (spec only)

```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md
PRD: [PRD_PATH]

Task:
Write the service/business rules for the feature:
- Core rules (what must always be true)
- State transitions (if any) and invariants
- Conflict rules (409), not found (404), validation errors (422)
- Permission/RBAC checks
Update ONLY “Service/Business Rules” and “Error Model” sections.

Rules:
- No code.
- Be explicit: list rules as MUST/SHOULD statements.
```

---

## Prompt 6 — Logging/audit + performance/limits (spec only)

```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md
PRD: [PRD_PATH]

Task:
Update:
- Logging/Audit: what events to log, what metadata (userId, tenantId, entityId), and privacy rules (PII).
- Performance/Limits: expected p95 latency targets, max page size, rate limits, caching notes, max payload sizes.
- Analytics/Telemetry (if you track events)
Rules:
- No code.
- Must align with repo conventions (logger usage, audit tables if any).
```

---

## Prompt 7 — Testing matrix + manual QA (spec only)

```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md
PRD: [PRD_PATH]

Task:
Create a complete testing plan:
- Integration tests per endpoint: happy path + auth + RBAC + validation + conflicts + tenancy isolation
- Unit tests for tricky business logic
- Regression risks (what could break)
- Manual QA checklist formatted for Scalar (requests + expected results)
Update ONLY “Testing Matrix” and “Manual QA (Scalar)” sections.

Rules:
- No code.
- Make it executable by a human tester.
```

---

## Prompt 8 — “Definition of Done” + rollout (spec only)

```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md

Task:
Add a final section “Definition of Done” including checkboxes:
- PRD acceptance criteria met
- Swagger updated
- tests passing
- migration applied
- performance checked
- logging/audit verified
- front-end contract stable
Also add “Migration/Rollout Notes” (staging → prod, rollback plan).
Rules:
- No code.
```

---

# After the Living Spec is Frozen: Implementation Tasks

Once the spec is complete, implement in small, reviewable steps:

1) **DB/entities/migrations** (source of truth)  
2) **DTOs + validation + Swagger** (API contract)  
3) **Service logic** (business rules)  
4) **Controller endpoints** (wire it)  
5) **Tests** (integration + edge cases)  
6) **Manual QA / Scalar collection** (repeatable)  

Tip: keep each Codex run focused on **one task** and limit which folders/files it can touch.

---

## Optional: “Sticky Note” Task Cards (Big-company style)

After you create `docs/impl/[feature-slug].md`, generate independent tasks (30–90 minutes each):

- TASK-01: Entity + migration
- TASK-02: DTOs + Swagger
- TASK-03: Service rules enforcement
- TASK-04: Controllers/routes
- TASK-05: Integration tests
- TASK-06: Manual QA checklist / Scalar requests
- TASK-07: Definition of Done / rollout checklist

Each task should include:
- purpose
- files allowed to change
- checklist
- verification steps
- done criteria

---

## Notes
- Keep PRD separate from the implementation spec when possible:
  - `docs/prd/...` = what/why
  - `docs/impl/...` = how (living spec)
- If PRD changes, update the spec first, then code.

