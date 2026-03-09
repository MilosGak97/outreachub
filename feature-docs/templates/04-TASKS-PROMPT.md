# Task Breakdown Prompt

> Copy this prompt into Claude/ChatGPT. Replace all `[PLACEHOLDERS]`.
> Run AFTER the Spec is complete and approved.

---

## Full Prompt (Copy Everything Below)

```
You are a senior engineering lead breaking down a feature into implementable tasks.

**Feature:** [FEATURE_NAME]
**Spec Location:** `feature-docs/[feature-slug]/SPEC-[feature-slug].md`
**Output File:** `feature-docs/[feature-slug]/TASKS-[feature-slug].md`

---

## Task Generation Rules

1. **Granularity:** Each task should be 30-90 minutes of focused work
2. **Independence:** Tasks should be mergeable independently when possible
3. **Testability:** Every task that writes code MUST include its tests
4. **File Scope:** Each task must list exactly which files it can create/modify
5. **Verification:** Each task must have clear "done" criteria
6. **Order:** Tasks must be ordered by dependency (earlier tasks don't depend on later ones)
7. **Atomic:** Each task should do ONE thing well

---

## Task Template

For each task, use this exact format:

### TASK-[NN]: [Short Descriptive Title]

**Purpose:** [1 sentence - what does this accomplish?]

**Depends On:** [TASK-XX, TASK-YY] or "None"

**Estimated Time:** [30 min | 45 min | 60 min | 90 min]

**Files to Create:**
- `src/api/entities/[entity].entity.ts`
- `src/api/client/[feature]/dto/[dto].dto.ts`

**Files to Modify:**
- `src/api/client/[feature]/[feature].module.ts` (add imports)
- `src/api/client/client.module.ts` (register module)

**Implementation Details:**
- [Specific instruction 1]
- [Specific instruction 2]
- [Reference to spec section if helpful]

**Acceptance Criteria:**
- [ ] [Specific, verifiable criterion]
- [ ] [Specific, verifiable criterion]
- [ ] All tests pass

**Tests to Write:**
- `src/api/client/[feature]/__tests__/[feature].spec.ts`:
  - Test case 1: [description]
  - Test case 2: [description]

**Verification Steps:**
- [ ] Run: `npm run test -- [test-file]`
- [ ] Run: `npm run build` (no type errors)
- [ ] [Manual verification step if needed]

---

## Required Task Phases

Generate tasks in this order. Adjust task count based on feature complexity.

### Phase 1: Data Layer (Foundation)
- TASK-01: Create Entity + Migration
- TASK-02: Create Repository (if custom methods needed)

### Phase 2: API Contract (DTOs)
- TASK-03: Create Request DTOs + Validation
- TASK-04: Create Response DTOs
- TASK-05: Add Swagger Annotations

### Phase 3: Business Logic (Service)
- TASK-06: Service - Create Operation
- TASK-07: Service - Read/List Operations
- TASK-08: Service - Update Operation
- TASK-09: Service - Delete Operation
- TASK-10+: Additional Operations (setDefault, apply, etc.)

### Phase 4: API Endpoints (Controller)
- TASK-XX: Create Controller + Wire Endpoints
- TASK-XX: Register Module

### Phase 5: Integration Tests
- TASK-XX: Integration Tests - Happy Paths (P0)
- TASK-XX: Integration Tests - Auth & RBAC (P0)
- TASK-XX: Integration Tests - Validation Errors (P1)
- TASK-XX: Integration Tests - Tenant Isolation (P0)
- TASK-XX: Integration Tests - Edge Cases (P1)

### Phase 6: Polish & Documentation
- TASK-XX: Add Logging & Audit Events
- TASK-XX: Performance Verification
- TASK-XX: Manual QA Checklist Verification
- TASK-XX: Update API Documentation (if needed)

---

## Output Format

Generate a markdown file with:

### 1. Summary Table
| Task | Title | Depends On | Est. Time | Phase |
|------|-------|------------|-----------|-------|
| TASK-01 | Create Entity + Migration | None | 45 min | Data |
| TASK-02 | Create Request DTOs | TASK-01 | 30 min | API Contract |
| ... | ... | ... | ... | ... |

### 2. Dependency Graph
Show as ASCII or mermaid diagram:

TASK-01 (Entity)
    │
    ├── TASK-02 (Request DTOs)
    │       │
    │       └── TASK-05 (Service - Create)
    │               │
    │               └── TASK-08 (Controller)
    │
    └── TASK-03 (Response DTOs)
            │
            └── TASK-06 (Service - Read)

### 3. Task Details
Each task in full detail using the template above.

### 4. Definition of Done (Feature-Level)
- [ ] All tasks completed
- [ ] All tests passing
- [ ] Swagger documentation accurate
- [ ] Manual QA verified
- [ ] Code reviewed
- [ ] Merged to main

---

## Rules

- Keep task count reasonable: 8-20 tasks for most features
- Group related work but keep tasks atomic
- Every code task MUST include test requirements
- Be specific about file paths (use actual repo structure from spec)
- Include line-number hints when modifying existing files (e.g., "add to imports section")
- Reference spec sections for complex logic
- Estimate conservatively (it's OK to finish early)

---

## Example Task (for reference)

### TASK-03: Create Request DTOs for Filter Preset

**Purpose:** Define the request body structure for creating and updating filter presets.

**Depends On:** TASK-01 (Entity must exist first for type reference)

**Estimated Time:** 30 min

**Files to Create:**
- `src/api/client/filter-preset/dto/create-filter-preset.dto.ts`
- `src/api/client/filter-preset/dto/update-filter-preset.dto.ts`
- `src/api/client/filter-preset/dto/set-default-preset.dto.ts`

**Files to Modify:**
- `src/api/client/filter-preset/dto/index.ts` (add exports)

**Implementation Details:**
- Use class-validator decorators for validation
- Use @ApiProperty() for Swagger documentation
- Reference FieldFilterDto pattern from crm-object for filter structure
- Add @MaxLength(100) for preset name
- Add @IsUUID() for contextKey where applicable

**Acceptance Criteria:**
- [ ] CreateFilterPresetDto validates name (required, max 100 chars)
- [ ] CreateFilterPresetDto validates filters array structure
- [ ] UpdateFilterPresetDto extends PartialType(CreateFilterPresetDto)
- [ ] All DTOs have Swagger annotations
- [ ] Types compile without errors

**Tests to Write:**
- `src/api/client/filter-preset/__tests__/dto.spec.ts`:
  - Validation passes for valid create payload
  - Validation fails for empty name
  - Validation fails for name > 100 chars
  - Validation fails for invalid filter structure

**Verification Steps:**
- [ ] Run: `npm run build` (no type errors)
- [ ] Run: `npm run test -- dto.spec.ts`
- [ ] Check Swagger UI shows correct request body schema
```

---

## Tips for Better Tasks

1. **Single Responsibility:** Each task should do ONE thing. If you're saying "and also", split it.

2. **Test with Code:** Never write code without tests. They're part of the same task.

3. **Clear Dependencies:** If TASK-05 needs TASK-02's DTO, say so explicitly.

4. **File Boundaries:** Be strict about which files a task can touch. This prevents conflicts.

5. **Verify Locally:** Every task should have steps to verify it worked before moving on.

6. **Reference the Spec:** Complex logic should point to the spec section for details.