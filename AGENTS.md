# Project Conventions (MUST FOLLOW)

These rules are non-negotiable. Follow them for every change, file, endpoint, entity, DTO, enum, repository, and module.

---

## 1) Folder Structure (MANDATORY)

All template-related code must follow this structure:

src/api/
├── entities/
│   └── template/                    # All template-related entities HERE
│       ├── crm-template.entity.ts
│       ├── crm-template-module.entity.ts
│       └── ...
│
├── enums/
│   └── template/                    # All template-related enums HERE
│       ├── template-item-protection.enum.ts
│       └── ...
│
├── repositories/
│   └── postgres/
│       └── template/                # All template repositories HERE
│           ├── crm-template.repository.ts
│           └── ...
│
├── admin/
│   └── templates/                   # Admin API for managing templates
│       ├── templates.module.ts
│       ├── templates.controller.ts
│       ├── templates.service.ts
│       ├── dto/                     # DTOs for THIS module only
│       │   ├── create-template.dto.ts
│       │   └── ...
│       └── ...
│
└── client/
└── templates/                   # Client API (if needed)
└── ...

### Enforcement
- If you create any template entity outside `src/api/entities/template/` → STOP and move it.
- If you create any template enum outside `src/api/enums/template/` → STOP and move it.
- If you create any template repository outside `src/api/repositories/postgres/template/` → STOP and move it.
- DTOs must live ONLY inside the module’s own `/dto` folder (no shared DTOs).

---

## 2) Enum Convention (SWAGGER FRIENDLY) — REQUIRED

Every enum MUST define an `EnumName` constant and every TypeORM enum column MUST include `enumName`.

✅ Correct example:

```ts
export enum TemplateItemProtection {
  FULL = 'full',
  DELETE_PROTECTED = 'delete_protected',
  NONE = 'none',
}

export const TemplateItemProtectionEnumName = 'TemplateItemProtection';

@Column({
  type: 'enum',
  enum: TemplateItemProtection,
  enumName: TemplateItemProtectionEnumName, // REQUIRED
  nullable: true,
})
protection: TemplateItemProtection | null;
```

### Enforcement
- If an enum column is added without `enumName` → STOP and fix it.
- Enums must be exported from `src/api/enums/template/`.

---

## 3) Repository Pattern (KEEP SERVICES CLEAN)

Default rule: **Business logic lives in repositories whenever possible.**

- Complex queries → Repository
- Validation related to DB state → Repository
- Installation/order/graph retrieval logic that is mostly DB-driven → Repository
- Service should be a thin orchestration layer (call repo methods, handle transactions, combine results)

### Enforcement
- If logic grows in a service, refactor into repository methods.
- Services should not contain large query builders.

---

## 4) DTO Convention (NO SHARED DTOs)

- No shared DTOs across modules.
- Each module has its own `/dto` folder.
- DTOs must be self-contained.
- Always use:
    - `class-validator` decorators for validation
    - `@ApiProperty()` / `@ApiPropertyOptional()` for Swagger

### Enforcement
- If a DTO is placed outside the module’s `/dto` folder → STOP and fix it.
- Prefer explicit DTOs per endpoint rather than reusing “generic” DTOs.

---

## 5) Naming Convention for Template/System API Names (Collision-proof)

To prevent collisions between user-created and template-created items:

- Template/system-generated `apiName` MUST start with `_`
    - Examples: `_contact`, `_lead`, `_first_name`, `_move_to_lead`
- User-created `apiName` MUST NOT start with `_`
    - Examples: `contact`, `my_lead`, `custom_field`
- User-created `apiName` must start with a letter (a-z), then contain only letters, numbers, underscores.

Recommended regex for user-created apiName:
```ts
/^[a-zA-Z][a-zA-Z0-9_]*$/
```

### Enforcement
- Validate this rule in DTOs AND in backend logic.
- If a user tries to create an apiName starting with `_`, reject with 400.
- If a blueprint item apiName does NOT start with `_`, reject with 400.

---

## 6) Admin vs Client Responsibilities

- `src/api/admin/templates/*`
    - Admin CRUD for templates, modules, blueprint objects/fields/associations
    - Can activate/deactivate templates
    - Can preview “what will be installed”

- `src/api/client/templates/*`
    - Read-only: list templates, get template by slug, preview
    - Used during registration / onboarding flow

---

## 7) Output Quality Rules

- Prefer small, reviewable commits/changes.
- When creating new modules, follow this order:
    1) Entities
    2) Repositories
    3) DTOs
    4) Controller endpoints
    5) Thin service orchestrator
    6) Migrations (if needed)
- Avoid generic abstractions unless absolutely necessary.
- Keep code consistent with existing project patterns.

---

## 8) If Something Conflicts With These Rules

These conventions win.

If uncertain:
1) Search the repo for existing patterns
2) Match existing style
3) Keep changes minimal
4) Only ask if truly blocking; otherwise pick a sane default and proceed