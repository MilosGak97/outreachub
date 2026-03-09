# Context Pack Template

> Fill this out BEFORE generating PRD or Spec. Paste into prompts or save as `context.md` in your feature folder.

---

## Product Context (Pre-filled for this repo)

- **Product:** CRM SaaS with dynamic object types (contacts, deals, custom objects)
- **Surfaces:** Admin (`src/api/admin/`) and Client (`src/api/client/`)
- **Tenancy Key:** `companyId` - resolved via nestjs-cls context
- **Roles:**
  - **Admin User:** Platform administrators, access to global config (templates, companies, properties)
  - **Client User:** Company users, access to their company's CRM data only

---

## Feature Context

- **Feature Name:** [FEATURE_NAME]
- **Current Behavior:** [What happens today? Why is it a problem?]
- **Desired Behavior:** [What should happen after this ships?]
- **User Journey:** [2-3 sentence happy path example]

---

## Scope

- **In Scope (MVP):**
  - [Item 1]
  - [Item 2]

- **Out of Scope (v1):**
  - [Item 1]
  - [Item 2]

---

## Data & Domain

- **Entities Involved:** [Existing entities this feature touches - e.g., User, Company, CrmObject]
- **New Entities Needed:** [New tables/entities to create]
- **Key Identifiers:** [userId, companyId, objectTypeId, pageKey, etc.]

---

## UX Context

- **Screens/Pages:** [Where does this feature appear in the UI?]
- **UI States:**
  - Empty state: [What to show when no data]
  - Loading state: [Loading indicators]
  - Error state: [Error handling UI]
  - Success state: [Normal view]
  - [Other states specific to this feature]
- **Interaction Rules:** [What changes what? What doesn't change?]

---

## Technical Context (Pre-filled)

- **Admin Modules:** `src/api/admin/companies/`, `src/api/admin/templates/`, `src/api/admin/properties/`
- **Client Modules:** `src/api/client/object-related/crm-object/`, `src/api/client/auth2/`
- **Entities Location:** `src/api/entities/`
- **Repositories Location:** `src/api/repositories/postgres/`
- **Auth Pattern:** JWT guards, `@CurrentUser()` decorator, `CompanyContext` for tenant resolution
- **Similar Features to Reference:** [Look at existing features for patterns]

---

## Non-Functional Requirements

- **Performance:** [p95 latency target or "no noticeable slowdown"]
- **Security:** [RBAC rules, PII handling, audit requirements]
- **Limits:** [Max items per user, payload sizes, rate limits]

---

## Open Questions

- [Question 1?]
- [Question 2?]