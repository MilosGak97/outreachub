# Context Pack: List Filter Templates

> Filled from feature brief. Use before PRD/Spec generation.

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

- **Feature Name:** List Filter Templates (Saved Filters)
- **Current Behavior:** List pages (admin and client) show default, unfiltered results. Users can apply filters ad hoc, but filters are not persisted, so a page reload or revisit resets the view.
- **Desired Behavior:** Users can save a filter setup (filters only) as a named template per list page, choose a default template, and have that default applied automatically on page load. Users can clear the default to return to full results.
- **User Journey:** A support admin filters the Admins list to only active admins, saves it as "Active Admins", and marks it as default. Next visit to the Admins list auto-applies the saved filters. The user can clear the default to see all admins again.

---

## Scope

- **In Scope (MVP):**
  - Save named filter templates (filters only) per list endpoint (per user).
  - Mark one template as default per user + endpoint (and per object type for dynamic lists).
  - Auto-apply default filters on page load (admin + client surfaces).
  - Support both static lists (e.g., Admins, Companies) and dynamic object lists.

- **Out of Scope (v1):**
  - Sharing templates across users or companies.
  - Organization-wide defaults.
  - Cross-endpoint templates.

---

## Data & Domain

- **Entities Involved:** User, Admin, Company, CrmObject, CrmObjectType, CrmObjectField
- **New Entities Needed:** ListFilterTemplate (name TBD) storing filters + default flag per user
- **Key Identifiers:** userId/adminId, companyId, endpointKey, objectTypeId (dynamic lists), templateId

---

## UX Context

- **Screens/Pages:**
  - Admin list pages (e.g., `/admin/companies`, `/admin/admins`)
  - Client object list pages (`/crm-object`, object type list views)
- **UI States:**
  - Empty state: no saved templates yet; prompt to save current filters.
  - Loading state: list page loads while applying default template.
  - Error state: invalid or deleted template; fall back to unfiltered list with error toast.
  - Success state: template applied; default badge shown when applicable.
- **Interaction Rules:**
  - Selecting a template applies its filters to the page.
  - Marking a template as default makes it auto-apply on page load.
  - Clearing default removes auto-apply and shows full list on next load.

---

## Technical Context (Pre-filled)

- **Admin Modules:** `src/api/admin/companies/`, `src/api/admin/templates/`, `src/api/admin/properties/`
- **Client Modules:** `src/api/client/object-related/crm-object/`, `src/api/client/auth2/`
- **Entities Location:** `src/api/entities/`
- **Repositories Location:** `src/api/repositories/postgres/`
- **Auth Pattern:** JWT guards, `@CurrentUser()` decorator, `CompanyContext` for tenant resolution
- **Similar Features to Reference:** None identified yet

---

## Non-Functional Requirements

- **Performance:** No noticeable slowdown on list endpoints when applying templates.
- **Security:** Templates are only visible to the owning user; client templates are scoped by company.
- **Limits:** Max templates per user per endpoint: TBD.

---

## Open Questions

- None for now.
