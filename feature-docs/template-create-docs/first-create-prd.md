You are a senior product manager + backend architect.

We are designing a new CRM SaaS feature: “Saved Filter Presets” for list pages (tables).

Context:
- App has BOTH:
    1) STATIC pages we hardcode (ex: Admin > Companies)
    2) DYNAMIC object pages where clients can create custom object types (unknown schema ahead of time)
- Must work on BOTH Admin and Client surfaces.
- Both surfaces have list pages with tables + filters.
- Today: filters reset when users reload/re-open the page.
- We want users to save filter combinations as presets/templates and re-apply them later.

IMPORTANT: This is FILTERS ONLY. Do NOT include:
- column visibility/order
- sorting
- table layout
  (these are separate future features)

Goal:
Allow a user (Admin or Client user) to save, reuse, and set a default filter preset per page/context, so their filtered list view is consistent and fast to return to.

MVP Decisions/Constraints:
- Presets are PER USER (private) and tenant-safe (never leak across workspace/company).
- Presets are scoped to a generic CONTEXT KEY that uniquely identifies where it applies.
  Candidate pieces: surface ("admin"|"client"), pageKey (static pages), objectApiName/objectTypeKey (dynamic pages), optional tableId/viewId (if multiple tables).
- Applying a preset updates filter UI controls (chips/inputs) and reloads results.
- Support: create, rename, delete, set default, save current filters as preset.
- If user changes filters after applying a preset, show state as “Custom” until saved.

TASK:
PHASE 1 — Analysis (no PRD yet):
1) Summarize the feature in your own words (1–2 paragraphs).
2) List key product decisions we must lock (scope key design, default behavior, dynamic field changes, URL sync, etc.).
3) List major edge cases/risks (tenant isolation, deleted fields, invalid operators, etc.).
4) Ask ONLY the questions needed to remove ambiguity (min 3, max 8). Make them high-impact.

STOP after PHASE 1 and wait for my answers.

PHASE 2 — After I answer:
Write the full PRD using the required headings:
1) Goal / Problem Statement
2) Users & Roles
3) User Stories (at least 6; include static + dynamic pages; admin + client)
4) In Scope (MVP)
5) Out of Scope
6) UX Flow (screens + states)
7) Acceptance Criteria (testable checklist)
8) Non-Functional Requirements (security/perf/audit/logging)
9) Analytics/Telemetry
   Rules for PRD:
- Do NOT write endpoints, DB schema, DTOs, or implementation steps.
- Keep it product requirements + UX behavior only.