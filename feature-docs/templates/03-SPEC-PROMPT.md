# Technical Spec Generation Prompt

> Copy this prompt into Claude/ChatGPT. Replace all `[PLACEHOLDERS]`.
> Run AFTER the PRD and UX are complete.

---

## Full Prompt (Copy Everything Below)

```
You are a senior backend architect + API designer for a NestJS/TypeORM CRM SaaS.

**Feature:** [FEATURE_NAME]
**PRD Location:** `feature-docs/[feature-slug]/PRD-[feature-slug].md`
**UX Location:** `feature-docs/[feature-slug]/UX-[feature-slug].md`
**Output File:** `feature-docs/[feature-slug]/SPEC-[feature-slug].md`

---

## Project Conventions (Pre-filled)

Use these conventions when designing the spec:

| Area | Convention |
|------|------------|
| **Framework** | NestJS + TypeORM + PostgreSQL |
| **Tenancy** | `companyId` column + `BaseCompanyRepository` auto-filters by tenant |
| **Context** | nestjs-cls stores `companyId` in async local storage |
| **Admin Surface** | `src/api/admin/` - global data, not company-scoped |
| **Client Surface** | `src/api/client/` - company-scoped via guards |
| **Auth Guards** | `@UseGuards(JwtAuthGuard)`, `@CurrentUser()` decorator |
| **DTOs** | class-validator decorators, `@ApiProperty()` for Swagger |
| **Pagination** | `limit` + `offset` params, response includes `totalRecords`, `totalPages` |
| **Errors** | Standard exception filters, 401/403/404/409/422 codes |
| **Entities** | `src/api/entities/` with TypeORM decorators |
| **Repositories** | `src/api/repositories/postgres/` extending base repository |
| **Enums** | `src/api/enums/` organized by domain |
| **Testing** | Jest + supertest for integration tests |

---

## PHASE 1: Review Inputs & Verify Conventions

**Read the PRD and UX files first:**
- PRD defines WHAT to build (acceptance criteria, user stories)
- UX defines HOW it looks (screens, components, data displayed)
- Use UX to understand what data the frontend needs from APIs

**Then scan the repository to verify conventions:**
- Check similar existing features for patterns
- Identify any guards or decorators specific to this surface
- Note any existing entities this feature will relate to

---

## PHASE 2: Generate Technical Spec

Read the PRD and create a complete technical specification with these sections:

### 1. Overview
- Link to PRD and UX files
- 2-3 sentence summary
- Any project conventions notes from your repo scan

### 2. Data Model
For each entity:
- Entity name and table name
- All fields with: name, type, nullable, default, purpose
- Constraints (unique, check, etc.)
- Indexes (for query performance)
- Relations (ManyToOne, OneToMany, JoinColumn)
- Tenant isolation rules (companyId column, etc.)

Show as TypeORM-style pseudocode:
@Entity('table_name')
class EntityName {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  field: string;

  @ManyToOne(() => RelatedEntity)
  relation: RelatedEntity;
}

### 3. API Contract
For each endpoint:
- **Method + Path:** `POST /filter-preset`
- **Auth:** Required guard/decorator
- **Request Body Example:** (JSON)
- **Response Example:** (JSON)
- **Query Params:** (if any)
- **Status Codes:** List all possible (200, 201, 400, 401, 403, 404, 409, 422)

### 4. DTOs & Validation

**Important:** Response DTOs must include all data shown in UX screens.
Review UX file to ensure API responses contain what the frontend needs.

For each DTO:
- **Class Name:** CreateFilterPresetDto
- **Fields:**
  | Field | Type | Required | Validation | Swagger |
  |-------|------|----------|------------|---------|
  | name | string | Yes | @IsString(), @MaxLength(100) | @ApiProperty() |
- **Example Payload:** (JSON)
- **UX Alignment:** [Which screen/component uses this DTO]

### 5. Service Rules
- **MUST** statements (invariants that must always be true)
- **SHOULD** statements (soft rules, best practices)
- State transitions (if any)
- Conflict resolution rules
- Deduplication rules

### 6. Error Mapping
| Scenario | HTTP Status | Error Code | Message |
|----------|-------------|------------|---------|
| Not authenticated | 401 | UNAUTHORIZED | Authentication required |
| Wrong tenant | 403 | FORBIDDEN | Access denied |
| Entity not found | 404 | NOT_FOUND | Preset not found |
| Duplicate name | 409 | CONFLICT | Preset with this name already exists |
| Validation failed | 422 | VALIDATION_ERROR | [field-specific message] |

### 7. RBAC / Permissions
- Who can perform each action?
- Any role-based restrictions?
- Ownership rules (user can only access their own data)

### 8. Logging & Audit
| Event | Level | Metadata |
|-------|-------|----------|
| Preset created | INFO | userId, presetId, contextKey |
| Preset deleted | INFO | userId, presetId |
| Invalid preset applied | WARN | userId, presetId, reason |

### 9. Performance & Limits
- Expected p95 latency: < X ms
- Max items per page: X
- Max entities per user per context: X
- Max payload size: X KB
- Indexes needed for performance
- Caching strategy (if any)

### 10. Testing Matrix
For each endpoint, list test cases:
| Test Case | Type | Priority | Description |
|-----------|------|----------|-------------|
| Create preset - happy path | Integration | P0 | Valid request creates preset |
| Create preset - auth required | Integration | P0 | 401 without token |
| Create preset - wrong tenant | Integration | P0 | 403 for other company's data |
| Create preset - duplicate name | Integration | P1 | 409 for duplicate |
| Create preset - validation | Integration | P1 | 422 for invalid input |

### 11. Migration & Rollout
- Database migration steps (create table, add indexes)
- Rollback plan (how to undo if needed)
- Feature flag (if any)
- Staging → Prod checklist

### 12. Open Questions
- Any unresolved decisions (mark as TBD)
- Questions for product/design
- Assumptions made

### 13. Definition of Done
- [ ] PRD acceptance criteria met
- [ ] Entity + migration created
- [ ] DTOs with validation
- [ ] Service logic complete
- [ ] Controller endpoints wired
- [ ] Swagger documentation accurate
- [ ] Integration tests passing
- [ ] Manual QA verified
- [ ] Logging/audit implemented
- [ ] Performance validated

---

**Rules:**
- NO application code (TypeScript/JavaScript files)
- Pseudocode and JSON examples are OK
- If PRD is ambiguous, add to "Open Questions" (don't invent)
- Be explicit about admin vs client behavior differences
- Follow repo conventions discovered in Phase 1
- Output ONLY the markdown content for the spec file
```

---

## Tips for Better Specs

1. **Show, Don't Tell:** Use JSON examples instead of describing structure in words

2. **Be Complete:** Every endpoint needs auth, request, response, and error examples

3. **Think Queries:** Add indexes for any field used in WHERE/ORDER BY clauses

4. **Test First:** Write the testing matrix as if you're defining the test suite

5. **Link Everything:** Reference PRD acceptance criteria in Definition of Done

6. **UX Alignment:** Check every screen in UX file - does your API provide all the data it needs?