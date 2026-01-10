Here’s a PRD draft + task breakdown based on your answers. I assumed this is per‑user, multiple templates per endpoint, auto‑apply, fieldId for dynamic columns/filters, raw
filters for static, sort/search saved, and available to all users.

# PRD: List View Templates (Per‑User)

## Feature Overview
- **Name:** List View Templates
- **Scope:** Admin + Client list endpoints (static + dynamic)
- **Ownership:** Per user (admin or client)
- **Summary:** Users can save multiple list views per endpoint, including column order/visibility, filters, sort, and search. A default view is auto‑applied for list endpoints.

## User Story
AS a user
I WANT to save multiple list views per endpoint (columns/filters/sort/search)
SO THAT I can quickly switch views and always load my preferred default.

## Functional Requirements
- Users can CRUD templates per endpoint (multiple templates allowed).
- Exactly one default template per user + endpoint (+ objectTypeId for dynamic).
- List endpoints automatically apply default template when no explicit template is chosen.
- UI can pass a `viewTemplateId` to apply a specific template on demand.
- Dynamic endpoints store column/filter/sort by `fieldId`.
- Static endpoints store raw filter payload (endpoint‑specific).

## Non‑Goals (v1)
- Sharing templates between users.
- Company‑level defaults.
- Template versioning/migration UI.

## Data Model
**ListViewTemplate**
- id: uuid
- ownerType: enum `ListViewTemplateOwnerType` = `ADMIN | USER`
- ownerId: uuid
- endpointKey: string (e.g. `admin:companies:list`, `client:crm-object:list`)
- objectTypeId: uuid | null (only for dynamic lists)
- name: string
- columns: jsonb
- filters: jsonb
- sort: jsonb
- searchQuery: string | null
- isDefault: boolean
- createdAt/updatedAt

**JSON shapes (v1)**
- columns:
    - dynamic: `{ fieldId, isVisible, order, label? }[]`
    - static: `{ key, isVisible, order, label? }[]`
- filters:
    - dynamic: `{ logic: 'AND'|'OR', items: [{ fieldId, operator, value? }] }`
    - static: `{ query: Record<string, any> }`
- sort:
    - dynamic: `{ fieldId, order: 'ASC'|'DESC' }`
    - static: `{ key, order: 'ASC'|'DESC' }`

## API Endpoints (New)
**Client**
- `GET /list-view-templates?endpointKey=&objectTypeId=`
- `POST /list-view-templates`
- `GET /list-view-templates/:id`
- `PATCH /list-view-templates/:id`
- `DELETE /list-view-templates/:id`

**Admin**
- Same endpoints under admin auth.

## List Endpoint Integration
- Add `viewTemplateId` (query/body) to list endpoints.
- If `viewTemplateId` not provided, apply user’s default template (if any).
- Merge rules:
    - Request fields override template fields.
    - Template fills missing filters/sort/search.
    - Columns are **stored only** (not applied to query results).

## Validation & Errors
- Template must match endpointKey + objectTypeId.
- Dynamic: fieldIds must belong to objectTypeId (400 if invalid).
- `viewTemplateId` must belong to current user (404/403).
- Setting `isDefault=true` unsets previous default for that endpoint.

## MVP Endpoints to Wire (Proposal)
- Client: `GET /crm-object`, `POST /crm-object/search`
- Admin: `GET /admin/companies`, `GET /admin/admins`, `GET /admin/companies/:id/users`

## Acceptance Criteria
- CRUD list view templates per user per endpoint.
- Default template auto‑applies to list endpoints.
- Dynamic templates validated by fieldId.
- Static templates persist raw filters.
- sort/search persisted and applied.

Task Breakdown (Ralph‑style, small stories)

1. Data model + migration

- Add ListViewTemplate entity + migration + enum with enumName.
- JSONB columns for columns, filters, sort.
- Ensure unique default per owner/endpoint/objectType (repo logic or partial index).

2. Template repository (thin service)

- Create repo under src/api/repositories/postgres/template/.
- Methods: list by endpoint/objectType, find by id+owner, upsert, set default (transaction).

3. Client list view templates module

- Controller + service + DTOs under src/api/client/.../dto.
- CRUD endpoints + validation for dynamic vs static JSON shapes.

4. Admin list view templates module

- Controller + service + DTOs under src/api/admin/.../dto.
- CRUD endpoints guarded by AdminAuth.

5. Dynamic list integration (CRM objects)

- Add viewTemplateId to GetAllObjectsQueryDto + SearchObjectsDto.
- Resolve + apply template, map fieldId → apiName for filters/sort.

6. Static list integration (admin companies)

- Add viewTemplateId to DTO.
- Merge saved filters/sort/search into list query.

7. Static list integration (admin admins + company users)

- Same as above for each endpoint.

8. Response metadata (optional but helpful)

- Add appliedTemplateId to list responses so UI can reflect the active view.

9. Testing & docs

- Manual checklist for saving/applying templates.
- (Optional) unit tests for repo merge/default logic.

Open questions to lock before implementation:

1. Do you want list view templates to live under the existing template folder structure (src/api/entities/template, src/api/admin/templates, src/api/client/templates), or should
   we isolate them in a new “list‑view” domain to avoid mixing with CRM templates?
2. Which static list endpoints do you want in the MVP besides companies/admins/company‑users?
3. Should list responses include appliedTemplateId, or is a separate template fetch enough?

If this draft looks right, I can save it as tasks/prd-list-view-templates.md and start with Story 1.