# Saved Filter Presets — Implementation Tasks

> **Feature:** Saved Filter Presets (Filters-only)
> **Spec:** `feature-docs/saved-filter-presets/results/03-SPEC.md`
> **Purpose:** Break down implementation into atomic Codex tasks

---

## 1. Summary Table

| Task | Title | Depends On | Est. Time | Phase |
|------|-------|------------|-----------|-------|
| TASK-01 | Create FilterPreset Entity | None | 45 min | Data Layer |
| TASK-02 | Create Database Migration | TASK-01 | 30 min | Data Layer |
| TASK-03 | Create FilterPreset Repository | TASK-01 | 45 min | Data Layer |
| TASK-04 | Create Enums (OwnerType) | None | 15 min | Data Layer |
| TASK-05 | Create Request DTOs | TASK-01, TASK-04 | 45 min | DTOs |
| TASK-06 | Create Response DTOs | TASK-01 | 30 min | DTOs |
| TASK-07 | Create FilterState DTO | None | 30 min | DTOs |
| TASK-08 | Service - Create Preset | TASK-03, TASK-05 | 45 min | Service |
| TASK-09 | Service - List Presets | TASK-03, TASK-06 | 30 min | Service |
| TASK-10 | Service - Get Preset by ID | TASK-03 | 20 min | Service |
| TASK-11 | Service - Update Preset (Overwrite) | TASK-03, TASK-05 | 45 min | Service |
| TASK-12 | Service - Set Default | TASK-03 | 30 min | Service |
| TASK-13 | Service - Clear Default | TASK-03 | 20 min | Service |
| TASK-14 | Service - Delete Preset | TASK-03 | 30 min | Service |
| TASK-15 | Create Controller + Wire Endpoints | TASK-08 to TASK-14 | 60 min | Controller |
| TASK-16 | Create Module + Register | TASK-15 | 20 min | Controller |
| TASK-17 | Integration Tests - CRUD Happy Paths | TASK-16 | 60 min | Tests |
| TASK-18 | Integration Tests - Auth & Tenant Isolation | TASK-16 | 45 min | Tests |
| TASK-19 | Integration Tests - Business Rules | TASK-16 | 45 min | Tests |
| TASK-20 | Add Logging & Audit Events | TASK-16 | 30 min | Polish |

**Total Estimated Time:** ~11 hours

---

## 2. Dependency Graph

```
TASK-04 (Enums)
    │
    ▼
TASK-01 (Entity) ◄─────────────────────────────────────┐
    │                                                   │
    ├── TASK-02 (Migration)                            │
    │                                                   │
    ├── TASK-03 (Repository) ──────────────────────────┤
    │       │                                          │
    │       ├── TASK-08 (Service: Create)              │
    │       ├── TASK-09 (Service: List)                │
    │       ├── TASK-10 (Service: Get)                 │
    │       ├── TASK-11 (Service: Update)              │
    │       ├── TASK-12 (Service: Set Default)         │
    │       ├── TASK-13 (Service: Clear Default)       │
    │       └── TASK-14 (Service: Delete)              │
    │               │                                   │
    │               ▼                                   │
    │       TASK-15 (Controller) ──► TASK-16 (Module)  │
    │                                       │          │
    │                                       ▼          │
    │                               TASK-17 (Tests)    │
    │                               TASK-18 (Tests)    │
    │                               TASK-19 (Tests)    │
    │                               TASK-20 (Logging)  │
    │                                                   │
    ├── TASK-05 (Request DTOs) ◄────────────────────────
    ├── TASK-06 (Response DTOs)
    └── TASK-07 (FilterState DTO)
```

---

## 3. Task Details

---

### TASK-01: Create FilterPreset Entity

**Purpose:** Define the FilterPreset entity with all required fields and constraints per spec section 4.

**Depends On:** None

**Estimated Time:** 45 min

**Files to Create:**
- `src/api/entities/filter-preset.entity.ts`

**Files to Modify:**
- `src/api/entities/index.ts` (add export)

**Implementation Details:**
- Reference spec section 4 "Data Model Design"
- Fields: `id`, `companyId`, `ownerType`, `ownerId`, `conceptKey`, `tableId`, `name`, `isDefault`, `filterState` (JSONB), `version`, `createdAt`, `updatedAt`
- Add `@ManyToOne` relation to Company entity
- Add unique constraint on `(companyId, ownerType, ownerId, conceptKey, tableId, name)` for name uniqueness
- Add partial unique index for single default per context: `WHERE isDefault = true`
- Add composite index on `(companyId, ownerType, ownerId, conceptKey, tableId)` for context lookups
- Use `@ApiProperty()` decorators for Swagger

**Acceptance Criteria:**
- [ ] Entity has all fields from spec section 4
- [ ] Unique constraint prevents duplicate names per context
- [ ] Partial unique index enforces single default per context
- [ ] Entity compiles without errors
- [ ] Swagger shows correct schema

**Tests to Write:**
- Entity compilation verified by build

**Verification Steps:**
- [ ] Run: `npm run build` (no type errors)
- [ ] Inspect entity in IDE for correct decorators

---

### TASK-02: Create Database Migration

**Purpose:** Generate and verify database migration for FilterPreset table.

**Depends On:** TASK-01

**Estimated Time:** 30 min

**Files to Create:**
- `src/migrations/XXXXXX-CreateFilterPreset.ts` (timestamp auto-generated)

**Implementation Details:**
- Run TypeORM migration:generate command
- Verify migration creates:
  - `filter_presets` table with all columns
  - Indexes for context lookups
  - Unique constraint on name per context
  - Partial unique index for single default
  - Foreign key to `companies` table
- Test migration up and down

**Acceptance Criteria:**
- [ ] Migration creates table with correct schema
- [ ] Migration runs successfully (up)
- [ ] Migration rolls back successfully (down)
- [ ] Indexes created correctly

**Verification Steps:**
- [ ] Run: `npm run migration:generate -- -n CreateFilterPreset`
- [ ] Run: `npm run migration:run`
- [ ] Verify table in database
- [ ] Run: `npm run migration:revert` (test rollback)
- [ ] Run: `npm run migration:run` again

---

### TASK-03: Create FilterPreset Repository

**Purpose:** Create repository with custom methods for context-based queries and default management.

**Depends On:** TASK-01

**Estimated Time:** 45 min

**Files to Create:**
- `src/api/repositories/postgres/filter-preset.repository.ts`

**Files to Modify:**
- `src/api/repositories/postgres/index.ts` (add export)

**Implementation Details:**
- Extend appropriate base repository (check existing patterns)
- Implement methods:
  - `findByContext(companyId, ownerType, ownerId, conceptKey, tableId)`: List presets for context
  - `findDefaultByContext(...)`: Find default preset for context
  - `findByIdAndOwner(id, companyId, ownerType, ownerId)`: Get preset with ownership check
  - `countByContext(...)`: Count presets for limit enforcement
  - `clearDefaultInContext(...)`: Unset previous default before setting new one
  - `existsByNameInContext(...)`: Check name uniqueness
- All methods must enforce tenant isolation via companyId
- Use QueryBuilder for complex queries

**Acceptance Criteria:**
- [ ] All methods enforce companyId filtering
- [ ] `findByContext` returns presets sorted by: default first, then name
- [ ] `clearDefaultInContext` only affects presets in same context
- [ ] Methods handle empty results gracefully

**Tests to Write:**
- `src/api/repositories/postgres/__tests__/filter-preset.repository.spec.ts`:
  - Test context filtering works correctly
  - Test tenant isolation (companyId)
  - Test owner isolation (ownerType + ownerId)

**Verification Steps:**
- [ ] Run: `npm run build`
- [ ] Run: `npm run test -- filter-preset.repository.spec.ts`

---

### TASK-04: Create Enums (OwnerType)

**Purpose:** Create OwnerType enum to distinguish between User and Admin ownership.

**Depends On:** None

**Estimated Time:** 15 min

**Files to Create:**
- `src/api/enums/filter-preset/owner-type.enum.ts`
- `src/api/enums/filter-preset/index.ts`

**Files to Modify:**
- `src/api/enums/index.ts` (add export)

**Implementation Details:**
- Create enum:
  ```typescript
  export enum OwnerType {
    USER = 'user',
    ADMIN = 'admin',
  }
  ```
- Follow existing enum patterns in codebase (check `src/api/enums/`)

**Acceptance Criteria:**
- [ ] Enum exported correctly
- [ ] Follows existing naming conventions

**Verification Steps:**
- [ ] Run: `npm run build`

---

### TASK-05: Create Request DTOs

**Purpose:** Define request DTOs for create, update, and query operations with validation.

**Depends On:** TASK-01, TASK-04

**Estimated Time:** 45 min

**Files to Create:**
- `src/api/common/filter-preset/dto/create-filter-preset.dto.ts`
- `src/api/common/filter-preset/dto/update-filter-preset.dto.ts`
- `src/api/common/filter-preset/dto/filter-preset-query.dto.ts`
- `src/api/common/filter-preset/dto/index.ts`

**Implementation Details:**
- **CreateFilterPresetDto:**
  - `conceptKey`: required string, min length 1
  - `tableId`: required string, min length 1
  - `name`: required string, min length 1
  - `isDefault`: optional boolean, default false
  - `filterState`: required object (FilterStateDto)
- **UpdateFilterPresetDto:**
  - `name`: optional string
  - `filterState`: optional FilterStateDto
  - `isDefault`: optional boolean
- **FilterPresetQueryDto:**
  - `conceptKey`: required string
  - `tableId`: required string
- Use class-validator decorators: `@IsString()`, `@IsNotEmpty()`, `@IsOptional()`, `@IsBoolean()`, `@ValidateNested()`
- Use `@ApiProperty()` for Swagger
- Reference spec section 6 "DTO Contract"

**Acceptance Criteria:**
- [ ] CreateFilterPresetDto validates all required fields
- [ ] UpdateFilterPresetDto allows partial updates
- [ ] Query DTO validates context parameters
- [ ] Swagger shows correct schemas
- [ ] Validation errors return proper messages

**Tests to Write:**
- `src/api/common/filter-preset/__tests__/dto.spec.ts`:
  - Valid create payload passes validation
  - Missing name fails validation
  - Invalid filterState structure fails
  - Query params validated correctly

**Verification Steps:**
- [ ] Run: `npm run build`
- [ ] Run: `npm run test -- dto.spec.ts`

---

### TASK-06: Create Response DTOs

**Purpose:** Define response DTOs for preset data returned by API.

**Depends On:** TASK-01

**Estimated Time:** 30 min

**Files to Create:**
- `src/api/common/filter-preset/dto/filter-preset-response.dto.ts`
- `src/api/common/filter-preset/dto/filter-preset-list-response.dto.ts`

**Files to Modify:**
- `src/api/common/filter-preset/dto/index.ts` (add exports)

**Implementation Details:**
- **FilterPresetResponseDto:**
  - `id`: string (UUID)
  - `name`: string
  - `isDefault`: boolean
  - `filterState`: FilterStateDto
  - `conceptKey`: string
  - `tableId`: string
  - `createdAt`: string (ISO date)
  - `updatedAt`: string (ISO date)
- **FilterPresetListResponseDto:**
  - `context`: object with conceptKey + tableId
  - `items`: FilterPresetResponseDto[]
  - `limit`: number (50)
- Use `@ApiProperty()` with proper types to avoid `any[]`
- Reference spec section 5.1 response examples

**Acceptance Criteria:**
- [ ] Response DTOs match spec section 5 examples
- [ ] No `any[]` in Swagger output
- [ ] Dates formatted as ISO strings

**Verification Steps:**
- [ ] Run: `npm run build`
- [ ] Check Swagger UI shows correct response schemas

---

### TASK-07: Create FilterState DTO

**Purpose:** Define the FilterState structure for storing filter configurations.

**Depends On:** None

**Estimated Time:** 30 min

**Files to Create:**
- `src/api/common/filter-preset/dto/filter-state.dto.ts`
- `src/api/common/filter-preset/dto/dynamic-filter-item.dto.ts`

**Files to Modify:**
- `src/api/common/filter-preset/dto/index.ts` (add exports)

**Implementation Details:**
- **FilterStateDto:**
  ```typescript
  {
    version: number; // must be 1
    searchText: string | null;
    filters: Record<string, any> | DynamicFiltersDto;
    meta?: { createdFrom?: string };
  }
  ```
- **DynamicFiltersDto** (for dynamic object pages):
  ```typescript
  {
    logic: 'AND' | 'OR';
    items: DynamicFilterItemDto[];
  }
  ```
- **DynamicFilterItemDto:**
  ```typescript
  {
    fieldId: string; // UUID
    op: string; // operator: eq, in, contains, etc.
    value: any;
  }
  ```
- Reference spec section 4 "Filter state format"
- Validate version = 1
- Allow flexible filter structure for static pages

**Acceptance Criteria:**
- [ ] FilterStateDto validates version field
- [ ] Supports both static (object) and dynamic (structured) filter formats
- [ ] Swagger documents structure clearly

**Tests to Write:**
- `src/api/common/filter-preset/__tests__/filter-state.dto.spec.ts`:
  - Valid static filter state passes
  - Valid dynamic filter state passes
  - Invalid version fails
  - Missing required fields fail

**Verification Steps:**
- [ ] Run: `npm run build`
- [ ] Run: `npm run test -- filter-state.dto.spec.ts`

---

### TASK-08: Service - Create Preset

**Purpose:** Implement service method to create a new filter preset with validation and business rules.

**Depends On:** TASK-03, TASK-05

**Estimated Time:** 45 min

**Files to Create:**
- `src/api/common/filter-preset/filter-preset.service.ts`

**Implementation Details:**
- Method: `createPreset(dto: CreateFilterPresetDto, ownerType: OwnerType, ownerId: string, companyId: string)`
- Business rules (spec section 7):
  - Check name uniqueness in context → 409 if duplicate
  - Check preset count < 50 in context → 422 if limit reached
  - If `isDefault = true`, clear any existing default in context first
- Return created preset
- Reference spec sections 5.1 and 7

**Acceptance Criteria:**
- [ ] Creates preset with all fields
- [ ] Enforces name uniqueness per context (case-insensitive)
- [ ] Enforces 50 preset limit per context
- [ ] Handles default flag correctly (clears previous default)
- [ ] Throws proper errors (409 for duplicate, 422 for limit)

**Tests to Write:**
- `src/api/common/filter-preset/__tests__/filter-preset.service.spec.ts`:
  - Happy path: creates preset successfully
  - Duplicate name returns 409
  - 50th preset created, 51st returns 422
  - Setting default clears previous default

**Verification Steps:**
- [ ] Run: `npm run build`
- [ ] Run: `npm run test -- filter-preset.service.spec.ts`

---

### TASK-09: Service - List Presets

**Purpose:** Implement service method to list all presets for a context.

**Depends On:** TASK-03, TASK-06

**Estimated Time:** 30 min

**Files to Modify:**
- `src/api/common/filter-preset/filter-preset.service.ts`

**Implementation Details:**
- Method: `listPresets(conceptKey, tableId, ownerType, ownerId, companyId)`
- Returns presets sorted: default first, then by name
- Maps to FilterPresetListResponseDto
- Reference spec section 5.1 "List presets"

**Acceptance Criteria:**
- [ ] Returns only presets for the specified context
- [ ] Sorted correctly (default first, then name)
- [ ] Enforces tenant isolation
- [ ] Returns empty array if no presets

**Tests to Write:**
- Add to `filter-preset.service.spec.ts`:
  - Lists presets for context
  - Returns empty for new context
  - Does not return presets from other contexts
  - Does not return presets from other users

**Verification Steps:**
- [ ] Run: `npm run test -- filter-preset.service.spec.ts`

---

### TASK-10: Service - Get Preset by ID

**Purpose:** Implement service method to get a single preset by ID with ownership verification.

**Depends On:** TASK-03

**Estimated Time:** 20 min

**Files to Modify:**
- `src/api/common/filter-preset/filter-preset.service.ts`

**Implementation Details:**
- Method: `getPresetById(id, ownerType, ownerId, companyId)`
- Returns preset if found and owned by requester
- Throws 404 if not found or not owned
- Reference spec section 8 "Auth / scope"

**Acceptance Criteria:**
- [ ] Returns preset when found and owned
- [ ] Returns 404 when preset doesn't exist
- [ ] Returns 404 when preset exists but wrong owner (security: don't reveal existence)

**Tests to Write:**
- Add to `filter-preset.service.spec.ts`:
  - Gets preset by ID
  - Returns 404 for non-existent ID
  - Returns 404 for preset owned by different user

**Verification Steps:**
- [ ] Run: `npm run test -- filter-preset.service.spec.ts`

---

### TASK-11: Service - Update Preset (Overwrite)

**Purpose:** Implement service method to update preset name and/or filterState.

**Depends On:** TASK-03, TASK-05

**Estimated Time:** 45 min

**Files to Modify:**
- `src/api/common/filter-preset/filter-preset.service.ts`

**Implementation Details:**
- Method: `updatePreset(id, dto: UpdateFilterPresetDto, ownerType, ownerId, companyId)`
- If name changes, check uniqueness → 409 if duplicate
- If isDefault changes to true, clear previous default in context
- Updates name + filterState (spec says "Overwrite updates BOTH")
- Returns updated preset
- Reference spec sections 5.1 and 7

**Acceptance Criteria:**
- [ ] Updates name when provided
- [ ] Updates filterState when provided
- [ ] Enforces name uniqueness on rename
- [ ] Handles default flag change correctly
- [ ] Returns 404 if preset not found/not owned

**Tests to Write:**
- Add to `filter-preset.service.spec.ts`:
  - Updates name successfully
  - Updates filterState successfully
  - Rename to duplicate name returns 409
  - Setting isDefault=true clears previous default

**Verification Steps:**
- [ ] Run: `npm run test -- filter-preset.service.spec.ts`

---

### TASK-12: Service - Set Default

**Purpose:** Implement service method to set a preset as default for its context.

**Depends On:** TASK-03

**Estimated Time:** 30 min

**Files to Modify:**
- `src/api/common/filter-preset/filter-preset.service.ts`

**Implementation Details:**
- Method: `setDefault(id, ownerType, ownerId, companyId)`
- Clears any existing default in the same context
- Sets isDefault = true on the specified preset
- This can be part of updatePreset or separate method
- Reference spec section 5.1 "Set default"

**Acceptance Criteria:**
- [ ] Only one preset can be default per context
- [ ] Previous default is cleared before setting new one
- [ ] Returns updated preset
- [ ] Returns 404 if preset not found/not owned

**Tests to Write:**
- Add to `filter-preset.service.spec.ts`:
  - Sets preset as default
  - Previous default is cleared
  - Only one default exists after operation

**Verification Steps:**
- [ ] Run: `npm run test -- filter-preset.service.spec.ts`

---

### TASK-13: Service - Clear Default

**Purpose:** Implement service method to clear the default preset for a context.

**Depends On:** TASK-03

**Estimated Time:** 20 min

**Files to Modify:**
- `src/api/common/filter-preset/filter-preset.service.ts`

**Implementation Details:**
- Method: `clearDefault(conceptKey, tableId, ownerType, ownerId, companyId)`
- Finds preset with isDefault=true in context and sets to false
- Returns success even if no default existed
- Reference spec section 5.1 "Clear default"

**Acceptance Criteria:**
- [ ] Clears default if one exists
- [ ] Returns success if no default existed
- [ ] Only affects specified context

**Tests to Write:**
- Add to `filter-preset.service.spec.ts`:
  - Clears existing default
  - Succeeds when no default exists
  - Does not affect other contexts

**Verification Steps:**
- [ ] Run: `npm run test -- filter-preset.service.spec.ts`

---

### TASK-14: Service - Delete Preset

**Purpose:** Implement service method to delete a preset.

**Depends On:** TASK-03

**Estimated Time:** 30 min

**Files to Modify:**
- `src/api/common/filter-preset/filter-preset.service.ts`

**Implementation Details:**
- Method: `deletePreset(id, ownerType, ownerId, companyId)`
- Verify ownership before deleting
- If deleted preset was default, default becomes cleared (no replacement)
- Reference spec section 5.1 "Delete preset" and section 8

**Acceptance Criteria:**
- [ ] Deletes preset when owned by requester
- [ ] Returns 404 if preset not found/not owned
- [ ] Default is automatically cleared when default preset deleted

**Tests to Write:**
- Add to `filter-preset.service.spec.ts`:
  - Deletes preset successfully
  - Returns 404 for non-existent preset
  - Returns 404 for preset owned by different user
  - Deleting default preset clears default for context

**Verification Steps:**
- [ ] Run: `npm run test -- filter-preset.service.spec.ts`

---

### TASK-15: Create Controller + Wire Endpoints

**Purpose:** Create controller with all filter preset endpoints per spec section 5.

**Depends On:** TASK-08 through TASK-14

**Estimated Time:** 60 min

**Files to Create:**
- `src/api/common/filter-preset/filter-preset.controller.ts`

**Implementation Details:**
- Route prefix: `/filter-presets`
- Endpoints (reference spec section 5):
  - `GET /filter-presets?conceptKey=...&tableId=...` → list presets
  - `POST /filter-presets` → create preset
  - `GET /filter-presets/:id` → get preset by ID
  - `PATCH /filter-presets/:id` → update preset (overwrite)
  - `DELETE /filter-presets/:id` → delete preset
  - `DELETE /filter-presets/default?conceptKey=...&tableId=...` → clear default
- Use `@UseGuards()` for auth (check existing patterns for UserAuthGuard or AdminAuthGuard)
- Extract owner info from `@CurrentUser()` decorator
- Extract companyId from context (CompanyContext)
- Determine ownerType based on which surface (admin vs client)
- Add `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()` decorators

**Acceptance Criteria:**
- [ ] All endpoints from spec section 5 implemented
- [ ] Auth guard applied to all endpoints
- [ ] Correct HTTP methods and status codes
- [ ] Swagger documentation complete
- [ ] Error responses follow spec section 5.3

**Tests to Write:**
- Controller tests added in integration test tasks

**Verification Steps:**
- [ ] Run: `npm run build`
- [ ] Check Swagger UI shows all endpoints
- [ ] Test endpoints manually via Swagger/curl

---

### TASK-16: Create Module + Register

**Purpose:** Create FilterPreset module and register it in the application.

**Depends On:** TASK-15

**Estimated Time:** 20 min

**Files to Create:**
- `src/api/common/filter-preset/filter-preset.module.ts`

**Files to Modify:**
- `src/api/common/common.module.ts` (import FilterPresetModule)
- OR if surface-specific: modify `src/api/client/client.module.ts` and `src/api/admin/admin.module.ts`

**Implementation Details:**
- Import TypeORM entity
- Provide service and repository
- Export module for other modules to use if needed
- Decide: shared module in `common` or separate modules per surface
- Reference existing module patterns in codebase

**Acceptance Criteria:**
- [ ] Module properly configured with all dependencies
- [ ] Module registered in app
- [ ] Endpoints accessible via API

**Verification Steps:**
- [ ] Run: `npm run build`
- [ ] Run: `npm run start:dev`
- [ ] Verify endpoints appear in Swagger
- [ ] Make a test request to verify wiring

---

### TASK-17: Integration Tests - CRUD Happy Paths

**Purpose:** Write integration tests for all CRUD operations (happy paths).

**Depends On:** TASK-16

**Estimated Time:** 60 min

**Files to Create:**
- `src/api/common/filter-preset/__tests__/filter-preset.integration.spec.ts`

**Implementation Details:**
- Test each endpoint with valid inputs:
  - Create preset → 201
  - List presets → 200, returns created preset
  - Get preset by ID → 200
  - Update preset → 200
  - Set default → 200
  - Clear default → 200
  - Delete preset → 200
- Use test database and proper setup/teardown
- Follow existing integration test patterns

**Acceptance Criteria:**
- [ ] All CRUD operations tested
- [ ] Tests pass consistently
- [ ] Proper setup/teardown

**Tests to Write:**
- Create preset returns 201 with correct body
- List returns presets for context
- Get by ID returns preset
- Update modifies preset
- Delete removes preset

**Verification Steps:**
- [ ] Run: `npm run test:e2e -- filter-preset.integration.spec.ts`

---

### TASK-18: Integration Tests - Auth & Tenant Isolation

**Purpose:** Write integration tests for authentication and tenant isolation.

**Depends On:** TASK-16

**Estimated Time:** 45 min

**Files to Modify:**
- `src/api/common/filter-preset/__tests__/filter-preset.integration.spec.ts`

**Implementation Details:**
- Test auth requirements:
  - No token → 401
  - Invalid token → 401
- Test tenant isolation:
  - User A cannot see User B's presets (same company)
  - Company A cannot see Company B's presets
- Test ownership:
  - Cannot update preset owned by another user
  - Cannot delete preset owned by another user

**Acceptance Criteria:**
- [ ] 401 returned for unauthenticated requests
- [ ] Cross-user access blocked
- [ ] Cross-tenant access blocked

**Tests to Write:**
- Request without auth returns 401
- User cannot list other user's presets
- User cannot get other user's preset by ID
- User cannot update other user's preset
- User cannot delete other user's preset
- Cross-company access returns 404

**Verification Steps:**
- [ ] Run: `npm run test:e2e -- filter-preset.integration.spec.ts`

---

### TASK-19: Integration Tests - Business Rules

**Purpose:** Write integration tests for business rules (name uniqueness, limits, default handling).

**Depends On:** TASK-16

**Estimated Time:** 45 min

**Files to Modify:**
- `src/api/common/filter-preset/__tests__/filter-preset.integration.spec.ts`

**Implementation Details:**
- Test name uniqueness:
  - Create duplicate name → 409
  - Rename to duplicate → 409
  - Same name in different context → OK
- Test 50 preset limit:
  - Create 50 → OK
  - Create 51st → 422
- Test default handling:
  - Setting new default clears previous
  - Only one default per context
  - Deleting default clears it

**Acceptance Criteria:**
- [ ] Duplicate names rejected with 409
- [ ] 50 preset limit enforced with 422
- [ ] Single default per context enforced

**Tests to Write:**
- Duplicate name returns 409
- 51st preset returns 422
- New default clears old default
- Delete default preset clears default

**Verification Steps:**
- [ ] Run: `npm run test:e2e -- filter-preset.integration.spec.ts`

---

### TASK-20: Add Logging & Audit Events

**Purpose:** Implement audit logging for preset operations per spec section 9.

**Depends On:** TASK-16

**Estimated Time:** 30 min

**Files to Modify:**
- `src/api/common/filter-preset/filter-preset.service.ts`

**Implementation Details:**
- Add audit events (reference spec section 9):
  - `filter_preset_created`
  - `filter_preset_updated`
  - `filter_preset_deleted`
  - `filter_preset_default_set`
  - `filter_preset_default_cleared`
- Include metadata: companyId, ownerType, ownerId, conceptKey, tableId, presetId, presetName
- Use existing logging/audit patterns in codebase
- Do NOT log full filterState (may contain sensitive data)

**Acceptance Criteria:**
- [ ] All CRUD operations emit audit events
- [ ] Events include required metadata
- [ ] No sensitive filter data logged

**Verification Steps:**
- [ ] Run tests
- [ ] Check logs during manual testing
- [ ] Verify audit entries in database/log system

---

## 4. Definition of Done (Feature-Level)

- [ ] All 20 tasks completed
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Swagger documentation accurate and complete
- [ ] No TypeScript errors
- [ ] Manual QA verified (spec section 12)
- [ ] Code reviewed and approved
- [ ] Merged to main branch
- [ ] Deployed to staging
- [ ] Feature flag enabled (if applicable)

---

## 5. Notes for Codex

**When executing tasks:**
1. Read the spec (`03-SPEC.md`) before starting each task
2. Check existing patterns in codebase for consistency
3. Run `npm run build` after each task to catch errors early
4. Run relevant tests before moving to next task
5. Do NOT skip tests - they are part of the task

**Key files to reference:**
- Entity patterns: `src/api/entities/`
- Repository patterns: `src/api/repositories/postgres/`
- DTO patterns: `src/api/client/object-related/crm-object/dto/`
- Service patterns: `src/api/client/object-related/crm-object/crm-object.service.ts`
- Controller patterns: `src/api/client/object-related/crm-object/crm-object.controller.ts`
- Module patterns: `src/api/client/object-related/object-related.module.ts`

**Decision: Where to put the module:**
- If presets are used by BOTH admin and client surfaces → put in `src/api/common/`
- If surfaces need separate endpoints → create modules in both `admin` and `client` that share the common service/repo
