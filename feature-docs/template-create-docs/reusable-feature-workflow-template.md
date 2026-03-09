# Reusable Feature Context + PRD + Living Spec Template (Copy/Paste Ready)

Use this template for **every new feature** in your CRM SaaS. It helps you:
- build a **clean context pack** (so AI doesn’t guess)
- generate a **PRD** (what/why)
- generate a **Living Spec** (how) that drives: entities → DTOs → endpoints → tests

---

## 0) Naming Conventions (Fill These First)

- **Feature Name:** `[FEATURE_NAME]`
- **Feature Slug:** `[feature-slug]` (kebab-case)
- **Primary Surface(s):** `[admin | client | both]`
- **Page(s)/Object(s):** `[static pages / dynamic object pages / both]`
- **PRD Path:** `docs/prd/[feature-slug].md`
- **Living Spec Path:** `docs/impl/[feature-slug].md`

---

# 1) Context Pack Builder (What YOU should explain to AI)

When AI outputs “generic” docs or wrong architecture, it’s almost always missing context.
Build a **Context Pack** with the sections below. You can keep it in:
- `docs/context/[feature-slug].context.md` (recommended), or
- paste it directly into AI prompts.

## 1.1 Product Context
Fill in:
- **What is the product?** (CRM SaaS, modules, key concepts)
- **Who uses it?** (roles: admin users, client users, super admin, etc.)
- **Tenancy model:** (workspace/company/org), and what “tenant isolation” means for your app.
- **Surfaces:** admin app vs client app (and what each can access).

## 1.2 Feature Context (Current vs Desired)
Fill in:
- **Current behavior:** what happens today (and why it’s a problem).
- **Desired behavior:** what should happen after the feature ships.
- **User journeys:** 1–3 examples (happy path).
- **Out of scope:** explicitly list what you *will not* build in v1.

## 1.3 Data/Domain Context
Fill in:
- **Objects involved:** entities/tables or dynamic object types.
- **Identifiers:** which IDs exist (userId, tenantId, objectTypeKey, etc.).
- **Existing patterns:** do you already store user preferences? saved settings?

## 1.4 UI/UX Context
Fill in:
- **Screens involved:** where it appears in the UI.
- **States:** empty state, loading, error, “custom state”, etc.
- **Interaction rules:** what changes what (ex: “preset only changes filters; doesn’t touch columns”).

## 1.5 API & Architecture Context (Repo Conventions)
Fill in (or let AI scan repo, but you must allow it):
- **Folder structure:** e.g. `src/api/admin`, `src/api/client`, shared modules
- **Auth:** guards/middleware used, how user/tenant is resolved
- **Error format:** standard error response shape
- **Pagination/sort:** standard params (`limit/offset`, `cursor`, etc.)
- **Swagger/OpenAPI:** how you document endpoints + generate client types
- **Testing stack:** Jest + supertest, etc.

## 1.6 Non-Functional Requirements (NFRs)
Fill in:
- **Performance target:** (rough: “no noticeable slowdown”, or p95 < X ms)
- **Security:** RBAC rules, audit log expectations, PII handling
- **Limits:** max presets, max payload sizes, rate limiting notes

---

## 1.7 Context Pack Template (Copy/Paste)

```md
# Context Pack — [FEATURE_NAME]

## Product
- Product: CRM SaaS web app
- Surfaces: [admin/client/both]
- Tenancy: [tenant/workspace/company] key is called: [tenantId/companyId/workspaceId]
- Roles: [list roles + what they can access]

## Current Behavior
- Today: [describe]
- Pain: [why it’s bad]

## Desired Behavior
- After: [describe]
- UX rules: [what changes what]
- Out of scope (v1): [list]

## Data/Domain
- Objects involved: [entities/dynamic objects]
- Identifiers: [userId, tenantId, objectTypeKey, pageKey, tableId]
- Existing patterns in repo: [links/paths if known]

## UI/UX
- Screens: [where used]
- States: [empty/loading/error/custom]
- Examples: [2–3 user examples]

## API/Architecture Conventions
- Modules/folders: [paths]
- Auth/tenant resolution: [how]
- Error shape: [standard]
- Pagination/sort: [pattern]
- Swagger/OpenAPI generation: [tool]
- Testing stack: [stack]

## NFRs
- Performance target: [p95 or “no noticeable slowdown”]
- Security: [RBAC + audit]
- Limits: [max presets etc.]
```

---

# 2) PRD Template Prompt (Reusable)

**Best practice:** do PRD in 2 phases:
1) Analysis + questions  
2) PRD v1.0 after you answer

## 2.1 PRD Phase 1 Prompt (Analysis first, questions next)

Paste into Claude/ChatGPT/Codex:

```txt
You are a senior product manager + backend architect.

Feature: [FEATURE_NAME]
Use the Context Pack below.

TASK — PHASE 1 ONLY (no PRD yet):
1) Summarize the feature in your own words (1–2 paragraphs).
2) List key decisions we must lock (scope key, defaults, dynamic field changes, URL sync, limits, permissions).
3) List major edge cases/risks.
4) Ask ONLY the questions needed to remove ambiguity (min 3, max 8). Make them high-impact.

STOP after PHASE 1 and wait for my answers.

[PASTE CONTEXT PACK]
```

## 2.2 PRD Phase 2 Prompt (Generate PRD v1.0)

```txt
Now write PRD v1.0 for [FEATURE_NAME] using ONLY:
- the Context Pack
- my answers to your questions below

PRD must include:
1) Goal / Problem Statement
2) Users & Roles
3) User Stories (at least 6)
4) In Scope (MVP)
5) Out of Scope
6) UX Flow (screens + states)
7) Acceptance Criteria (testable checklist)
8) Non-Functional Requirements (security/perf/audit)
9) Analytics/Telemetry (events to track)

Rules:
- Do NOT write endpoints, DB schema, DTOs, or implementation steps.
- Keep it product requirements + UX behavior only.

[PASTE CONTEXT PACK]
[PASTE Q&A]
```

---

# 3) Living Spec Template (Reusable “How” Doc)

## 3.1 Living Spec File Structure

**Path:** `docs/impl/[feature-slug].md`

Sections:
1. Overview + links (PRD, designs)
2. Roles & Permissions (RBAC)
3. Scope Key / Context
4. Data model changes (entities/tables/relations)
5. API contract (endpoints + examples)
6. DTOs & validation rules
7. Service/business rules
8. Error model (401/403/404/409/422)
9. Logging & audit
10. Performance & limits
11. Testing matrix (unit/integration)
12. Manual QA checklist (Scalar)
13. Migration/Rollout notes
14. Open questions / decisions log
15. Definition of Done

---

# 4) “Instructions to ChatGPT (YOU)” — Build/Update the Living Spec

Use this when you want ChatGPT to generate/update `docs/impl/[feature-slug].md` in a consistent way.

## 4.1 ChatGPT Instruction Prompt (Spec-only, no code)

```txt
You are my product+engineering spec writer.

Inputs:
- PRD: docs/prd/[feature-slug].md
- Context pack (if available): docs/context/[feature-slug].context.md
- Repo conventions: scan the repo to learn patterns (tenant key, auth guards, DTO style, error shape, pagination).

Task:
Create or update docs/impl/[feature-slug].md with these sections:
1) Overview + links
2) Roles & Permissions (RBAC)
3) Scope Key / Context rules (how to uniquely scope this feature)
4) Data model design (entities, constraints, indexes)
5) API contract (endpoints + request/response examples)
6) DTO contract + validation rules + Swagger notes (avoid any[])
7) Service/business rules (MUST/SHOULD)
8) Error model mapping per endpoint
9) Logging/audit events
10) Performance & limits
11) Testing matrix + regression risks
12) Manual QA checklist (Scalar)
13) Migration/rollout notes + rollback
14) Open questions / decisions log
15) Definition of Done

Rules:
- DO NOT write code.
- DO NOT invent facts; if missing, mark as TBD and add it to “Open questions”.
- Keep admin/client and static/dynamic behavior explicit.
- Use examples (JSON) where helpful.
Output:
- The full markdown content for docs/impl/[feature-slug].md
```

---

# 5) Codex Prompt Pack (Fill the Living Spec Step-by-Step)

> These runs update **the same** living spec file.  
> Each prompt is focused and repeatable.

## Prompt 0 — Create/Reset spec skeleton (SPEC ONLY)
```txt
FEATURE: [FEATURE_NAME]
PRD: docs/prd/[feature-slug].md
OUTPUT FILE: docs/impl/[feature-slug].md

Create or rewrite docs/impl/[feature-slug].md with the standard headings.
Add placeholders and link to PRD.
No code. No implementation steps. Use TBD where needed.
Output only the markdown file content.
```

## Prompt 1 — Repo conventions scan (SPEC ONLY)
```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md

Scan the repo and document conventions:
- tenant key naming and how it is resolved
- user identity
- auth guards + RBAC patterns
- DTO/Swagger patterns
- error response shape / filters
- pagination/sort patterns
- admin vs client module structure
Update only the “Overview” section with a “Project Conventions” subsection.
No code changes.
```

## Prompt 2 — Data model design (SPEC ONLY)
```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md

Design the data model required by the PRD:
- entities/tables/relations
- required fields + types + purpose
- constraints + indexes
- tenant isolation rules
Update only “Data model” section.
No code.
```

## Prompt 3 — API contract (SPEC ONLY)
```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md

Define endpoints + behavior:
- method + path (admin/client)
- request/response examples
- pagination/sort/search rules (if applicable)
- status codes and error codes per endpoint
Update only “API contract”.
No code.
```

## Prompt 4 — DTO contract + validation (SPEC ONLY)
```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md

Define DTOs and validation rules as a contract:
- request DTOs + response DTOs
- required/optional fields
- formats/enums/arrays/nested objects
- Swagger notes to avoid any[] and unknown items
Update only “DTOs & validation”.
No code.
```

## Prompt 5 — Service rules + errors (SPEC ONLY)
```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md

Write business rules (MUST/SHOULD) and map errors:
- invariants and conflict rules
- RBAC checks
- 401/403/404/409/422 mapping
Update “Service rules” + “Error model”.
No code.
```

## Prompt 6 — Audit + performance (SPEC ONLY)
```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md

Specify:
- logging/audit events + metadata
- performance targets and limits
- telemetry events (if any)
Update “Logging/Audit” + “Performance/Limits”.
No code.
```

## Prompt 7 — Testing + Scalar QA (SPEC ONLY)
```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md

Create:
- integration test matrix per endpoint (happy path, auth, RBAC, validation, conflicts, tenant isolation)
- unit tests for tricky logic
- regression risks
- manual QA checklist in Scalar-friendly format
Update “Testing matrix” + “Manual QA”.
No code.
```

## Prompt 8 — Definition of Done + rollout (SPEC ONLY)
```txt
FEATURE: [FEATURE_NAME]
SPEC FILE: docs/impl/[feature-slug].md

Add:
- Definition of Done checklist
- rollout notes (staging → prod)
- rollback notes
Update “Definition of Done” + “Migration/Rollout”.
No code.
```

---

# 6) After Spec is Frozen: Implementation Order (Code Tasks)

Implement in small steps (each Codex run = one task):

1) **DB/entities/migrations**
2) **DTOs + validation + Swagger**
3) **Service logic**
4) **Controllers/routes**
5) **Tests**
6) **Manual QA docs**
7) **Done checklist + release notes**

---

## Optional: Sticky Note Tasks (Big-company style)
Generate task cards from the living spec:
- each task 30–90 minutes
- strict file touch rules
- clear verification steps
- DoD per task

---

## Quick Tip (Always)
If something changes:
1) update PRD (if scope changes)
2) update living spec
3) then update code

