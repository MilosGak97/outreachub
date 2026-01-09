# Codex Implementation Guide: Template System

> **Philosophy**: Quality over speed. Each step should be small, testable, and reviewable.

---

## Project Conventions (MUST FOLLOW)

### Folder Structure

```
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
```

### Enum Convention (SWAGGER FRIENDLY)

Every enum MUST have `enumName` static property:

```typescript
// CORRECT - Swagger friendly
export enum TemplateItemProtection {
  FULL = 'full',
  DELETE_PROTECTED = 'delete_protected',
  NONE = 'none',
}

export const TemplateItemProtectionEnumName = 'TemplateItemProtection';

// Usage in entity:
@Column({
  type: 'enum',
  enum: TemplateItemProtection,
  enumName: TemplateItemProtectionEnumName,  // <-- REQUIRED
  nullable: true
})
protection: TemplateItemProtection;
```

### Repository Pattern

- **Logic goes in repositories** whenever possible
- Services should be thin wrappers
- Complex queries, validation, business logic → Repository
- Simple delegation, orchestration → Service

### DTO Convention

- **No shared DTOs** - each module has its own `/dto` folder
- DTOs should be self-contained
- Use `class-validator` decorators
- Use `@ApiProperty()` for Swagger

---

## Implementation Steps

---

# PHASE 1: Foundation (Enums & Entities)

---

## Step 1.1: Create Protection Enum

**File**: `src/api/enums/template/template-item-protection.enum.ts`

**Task**: Create the protection level enum used across all template entities.

**Requirements**:
- Three values: `FULL`, `DELETE_PROTECTED`, `NONE`
- Include `enumName` constant for Swagger
- Add JSDoc comments explaining each level

**Expected Output**:
```typescript
/**
 * Protection levels for template-created items
 */
export enum TemplateItemProtection {
  /** Cannot delete, cannot modify core attributes */
  FULL = 'full',

  /** Cannot delete, but can modify (add fields, change config) */
  DELETE_PROTECTED = 'delete_protected',

  /** No restrictions - treat as user-created */
  NONE = 'none',
}

export const TemplateItemProtectionEnumName = 'TemplateItemProtection';
```

---

## Step 1.2: Create Template Entity

**File**: `src/api/entities/template/crm-template.entity.ts`

**Task**: Create the main template entity (industry level).

**Columns**:
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | No | generated | Primary key |
| `name` | varchar(255) | No | - | "Movers CRM" |
| `slug` | varchar(100) | No | - | Unique, lowercase |
| `description` | text | Yes | - | |
| `icon` | varchar(255) | Yes | - | Icon name/URL |
| `isActive` | boolean | No | true | |
| `displayOrder` | int | No | 0 | |
| `createdAt` | timestamp | No | now | |
| `updatedAt` | timestamp | No | now | |

**Relations**:
- `@OneToMany` → `CrmTemplateModule` (cascade: true)

**Indexes**:
- Unique on `slug`

**Notes**:
- Use `@Index()` decorator for slug
- Table name: `crm_template`

---

## Step 1.3: Create Template Module Entity

**File**: `src/api/entities/template/crm-template-module.entity.ts`

**Task**: Create the module entity (feature grouping within template).

**Columns**:
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | No | generated | Primary key |
| `templateId` | UUID | No | - | FK |
| `name` | varchar(255) | No | - | "Local Moving" |
| `slug` | varchar(100) | No | - | Unique within template |
| `description` | text | Yes | - | |
| `isCore` | boolean | No | false | Auto-installed if true |
| `dependsOn` | text[] | Yes | [] | Module slugs |
| `conflictsWith` | text[] | Yes | [] | Module slugs |
| `displayOrder` | int | No | 0 | |
| `createdAt` | timestamp | No | now | |
| `updatedAt` | timestamp | No | now | |

**Relations**:
- `@ManyToOne` → `CrmTemplate` (onDelete: CASCADE)
- `@OneToMany` → `CrmTemplateBlueprintObject` (cascade: true)
- `@OneToMany` → `CrmTemplateBlueprintAssociation` (cascade: true)

**Indexes**:
- Unique on `[templateId, slug]`

**Notes**:
- Table name: `crm_template_module`
- `dependsOn` and `conflictsWith` use `simple-array` or `text[]` type

---

## Step 1.4: Create Blueprint Object Entity

**File**: `src/api/entities/template/crm-template-blueprint-object.entity.ts`

**Task**: Create the blueprint object entity (what CrmObjectType to create).

**Columns**:
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | No | generated | Primary key |
| `moduleId` | UUID | No | - | FK |
| `name` | varchar(255) | No | - | "Contact" |
| `apiName` | varchar(100) | No | - | "_contact" (starts with _) |
| `description` | text | Yes | - | |
| `protection` | enum | No | NONE | TemplateItemProtection |
| `displayOrder` | int | No | 0 | |
| `createdAt` | timestamp | No | now | |

**Relations**:
- `@ManyToOne` → `CrmTemplateModule` (onDelete: CASCADE)
- `@OneToMany` → `CrmTemplateBlueprintField` (cascade: true)

**Indexes**:
- Unique on `[moduleId, apiName]`

**Notes**:
- Table name: `crm_template_blueprint_object`
- Use `enumName` for protection column

---

## Step 1.5: Create Blueprint Field Entity

**File**: `src/api/entities/template/crm-template-blueprint-field.entity.ts`

**Task**: Create the blueprint field entity.

**Columns**:
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | No | generated | Primary key |
| `blueprintObjectId` | UUID | No | - | FK |
| `name` | varchar(255) | No | - | "First Name" |
| `apiName` | varchar(100) | No | - | "_first_name" |
| `fieldType` | enum | No | - | Use existing FieldType enum |
| `description` | text | Yes | - | |
| `isRequired` | boolean | No | false | |
| `shape` | jsonb | Yes | - | Value structure |
| `configShape` | jsonb | Yes | - | Config (SELECT options, etc.) |
| `protection` | enum | No | NONE | TemplateItemProtection |
| `displayOrder` | int | No | 0 | |
| `createdAt` | timestamp | No | now | |

**Relations**:
- `@ManyToOne` → `CrmTemplateBlueprintObject` (onDelete: CASCADE)

**Indexes**:
- Unique on `[blueprintObjectId, apiName]`

**Notes**:
- Table name: `crm_template_blueprint_field`
- Import `FieldType` from existing location
- Use `enumName` for both enum columns

---

## Step 1.6: Create Blueprint Association Entity

**File**: `src/api/entities/template/crm-template-blueprint-association.entity.ts`

**Task**: Create the blueprint association entity.

**Columns**:
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | No | generated | Primary key |
| `moduleId` | UUID | No | - | FK |
| `name` | varchar(255) | No | - | "Contact to Company" |
| `apiName` | varchar(100) | No | - | "_contact_to_company" |
| `sourceObjectApiName` | varchar(100) | No | - | "_contact" |
| `targetObjectApiName` | varchar(100) | No | - | "_company" |
| `sourceCardinality` | enum | No | - | ONE / MANY |
| `targetCardinality` | enum | No | - | ONE / MANY |
| `isBidirectional` | boolean | No | true | |
| `reverseName` | varchar(255) | Yes | - | |
| `description` | text | Yes | - | |
| `protection` | enum | No | NONE | TemplateItemProtection |
| `displayOrder` | int | No | 0 | |
| `createdAt` | timestamp | No | now | |

**Relations**:
- `@ManyToOne` → `CrmTemplateModule` (onDelete: CASCADE)

**Indexes**:
- Unique on `[moduleId, apiName]`

**Notes**:
- Table name: `crm_template_blueprint_association`
- Import `AssociationCardinality` from existing enums
- Use `enumName` for all enum columns

---

## Step 1.7: Create Company Template Entity

**File**: `src/api/entities/template/company-template.entity.ts`

**Task**: Create entity to track which template a company installed.

**Columns**:
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | No | generated | Primary key |
| `companyId` | UUID | No | - | FK to Company |
| `templateId` | UUID | No | - | FK to CrmTemplate |
| `installedAt` | timestamp | No | now | |
| `installedBy` | UUID | Yes | - | User ID who installed |

**Relations**:
- `@ManyToOne` → `Company` (onDelete: CASCADE)
- `@ManyToOne` → `CrmTemplate` (onDelete: RESTRICT)

**Indexes**:
- Unique on `companyId` (one template per company)

**Notes**:
- Table name: `company_template`

---

## Step 1.8: Create Company Installed Module Entity

**File**: `src/api/entities/template/company-installed-module.entity.ts`

**Task**: Create entity to track which modules a company has installed.

**Columns**:
| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `id` | UUID | No | generated | Primary key |
| `companyId` | UUID | No | - | FK to Company |
| `moduleId` | UUID | No | - | FK to CrmTemplateModule |
| `installedAt` | timestamp | No | now | |
| `installedBy` | UUID | Yes | - | User ID |

**Relations**:
- `@ManyToOne` → `Company` (onDelete: CASCADE)
- `@ManyToOne` → `CrmTemplateModule` (onDelete: RESTRICT)

**Indexes**:
- Unique on `[companyId, moduleId]`

**Notes**:
- Table name: `company_installed_module`

---

## Step 1.9: Update Existing Entities (Add Template Origin)

**Files to modify**:
- `src/api/entities/object/crm-object-type.entity.ts`
- `src/api/entities/object/crm-object-field.entity.ts`
- `src/api/entities/object/crm-association-type.entity.ts`

**Task**: Add template tracking columns to existing entities.

**Add these columns to EACH entity**:

| Column | Type | Nullable | Default | Notes |
|--------|------|----------|---------|-------|
| `templateOriginId` | UUID | Yes | null | FK to respective blueprint |
| `protection` | enum | Yes | null | TemplateItemProtection |

**For CrmObjectType**:
```typescript
@Column({ type: 'uuid', nullable: true })
templateOriginId: string | null;

@Column({
  type: 'enum',
  enum: TemplateItemProtection,
  enumName: TemplateItemProtectionEnumName,
  nullable: true
})
protection: TemplateItemProtection | null;
```

**Notes**:
- Import the enum from `src/api/enums/template/`
- No relations needed (just store UUID, don't join to blueprints)
- Null means user-created / no protection

---

## Step 1.10: Create Barrel Export for Template Entities

**File**: `src/api/entities/template/index.ts`

**Task**: Create barrel export for all template entities.

```typescript
export * from './crm-template.entity';
export * from './crm-template-module.entity';
export * from './crm-template-blueprint-object.entity';
export * from './crm-template-blueprint-field.entity';
export * from './crm-template-blueprint-association.entity';
export * from './company-template.entity';
export * from './company-installed-module.entity';
```

---

# PHASE 2: Repositories

---

## Step 2.1: Create Template Repository

**File**: `src/api/repositories/postgres/template/crm-template.repository.ts`

**Task**: Create repository for CrmTemplate with all query logic.

**Methods to implement**:

| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `findAll` | `{ limit, offset, searchQuery?, isActive? }` | `{ result, totalRecords, ... }` | Paginated list |
| `findBySlug` | `slug: string` | `CrmTemplate \| null` | Include modules |
| `findBySlugWithFullTree` | `slug: string` | `CrmTemplate \| null` | Include modules, objects, fields, associations |
| `isSlugAvailable` | `slug: string, excludeId?: string` | `boolean` | Check uniqueness |
| `createTemplate` | `dto: CreateTemplateDto` | `CrmTemplate` | |
| `updateTemplate` | `id: string, dto: UpdateTemplateDto` | `void` | |
| `deleteTemplate` | `id: string` | `void` | Check if any company uses it |

**Notes**:
- Use QueryBuilder for complex joins
- Implement pagination helper (same pattern as existing repos)
- Validate before delete (cannot delete if companies use it)

---

## Step 2.2: Create Template Module Repository

**File**: `src/api/repositories/postgres/template/crm-template-module.repository.ts`

**Task**: Create repository for CrmTemplateModule.

**Methods to implement**:

| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `findByTemplateId` | `templateId: string` | `CrmTemplateModule[]` | Ordered by displayOrder |
| `findBySlug` | `templateId: string, slug: string` | `CrmTemplateModule \| null` | |
| `findWithBlueprints` | `moduleId: string` | `CrmTemplateModule` | Include objects, fields, associations |
| `isSlugAvailable` | `templateId: string, slug: string, excludeId?: string` | `boolean` | |
| `createModule` | `dto: CreateModuleDto` | `CrmTemplateModule` | |
| `updateModule` | `id: string, dto: UpdateModuleDto` | `void` | |
| `deleteModule` | `id: string` | `void` | Check if companies have it installed |
| `reorderModules` | `templateId: string, orderedIds: string[]` | `void` | Update displayOrder |

---

## Step 2.3: Create Blueprint Object Repository

**File**: `src/api/repositories/postgres/template/crm-template-blueprint-object.repository.ts`

**Task**: Create repository for CrmTemplateBlueprintObject.

**Methods to implement**:

| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `findByModuleId` | `moduleId: string` | `CrmTemplateBlueprintObject[]` | With fields |
| `findByApiName` | `moduleId: string, apiName: string` | `...Object \| null` | |
| `isApiNameAvailable` | `moduleId: string, apiName: string, excludeId?: string` | `boolean` | |
| `createObject` | `dto: CreateBlueprintObjectDto` | `CrmTemplateBlueprintObject` | Validate apiName starts with _ |
| `updateObject` | `id: string, dto: UpdateBlueprintObjectDto` | `void` | |
| `deleteObject` | `id: string` | `void` | Cascade deletes fields |
| `reorderObjects` | `moduleId: string, orderedIds: string[]` | `void` | |

**Validation**:
- `apiName` MUST match pattern: `^_[a-z][a-z0-9_]*$`

---

## Step 2.4: Create Blueprint Field Repository

**File**: `src/api/repositories/postgres/template/crm-template-blueprint-field.repository.ts`

**Task**: Create repository for CrmTemplateBlueprintField.

**Methods to implement**:

| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `findByObjectId` | `objectId: string` | `CrmTemplateBlueprintField[]` | Ordered |
| `isApiNameAvailable` | `objectId: string, apiName: string, excludeId?: string` | `boolean` | |
| `createField` | `dto: CreateBlueprintFieldDto` | `CrmTemplateBlueprintField` | Validate apiName |
| `updateField` | `id: string, dto: UpdateBlueprintFieldDto` | `void` | |
| `deleteField` | `id: string` | `void` | |
| `reorderFields` | `objectId: string, orderedIds: string[]` | `void` | |
| `bulkCreateFields` | `objectId: string, fields: CreateBlueprintFieldDto[]` | `CrmTemplateBlueprintField[]` | For seeding |

**Validation**:
- `apiName` MUST match pattern: `^_[a-z][a-z0-9_]*$`
- Validate `fieldType` against existing FieldType enum

---

## Step 2.5: Create Blueprint Association Repository

**File**: `src/api/repositories/postgres/template/crm-template-blueprint-association.repository.ts`

**Task**: Create repository for CrmTemplateBlueprintAssociation.

**Methods to implement**:

| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `findByModuleId` | `moduleId: string` | `...Association[]` | |
| `isApiNameAvailable` | `moduleId: string, apiName: string, excludeId?: string` | `boolean` | |
| `createAssociation` | `dto: CreateBlueprintAssociationDto` | `...Association` | Validate apiNames exist |
| `updateAssociation` | `id: string, dto: UpdateBlueprintAssociationDto` | `void` | |
| `deleteAssociation` | `id: string` | `void` | |
| `validateObjectApiNames` | `templateId: string, sourceApiName: string, targetApiName: string` | `boolean` | Check both exist in template |

**Validation**:
- `apiName` MUST match pattern: `^_[a-z][a-z0-9_]*$`
- `sourceObjectApiName` and `targetObjectApiName` must exist in template

---

## Step 2.6: Create Company Template Repository

**File**: `src/api/repositories/postgres/template/company-template.repository.ts`

**Task**: Create repository for CompanyTemplate.

**Methods to implement**:

| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `findByCompanyId` | `companyId: string` | `CompanyTemplate \| null` | With template info |
| `hasTemplate` | `companyId: string` | `boolean` | |
| `install` | `companyId: string, templateId: string, userId?: string` | `CompanyTemplate` | |
| `getCompaniesUsingTemplate` | `templateId: string` | `number` | Count for deletion check |

---

## Step 2.7: Create Company Installed Module Repository

**File**: `src/api/repositories/postgres/template/company-installed-module.repository.ts`

**Task**: Create repository for CompanyInstalledModule.

**Methods to implement**:

| Method | Parameters | Returns | Notes |
|--------|------------|---------|-------|
| `findByCompanyId` | `companyId: string` | `CompanyInstalledModule[]` | With module info |
| `isModuleInstalled` | `companyId: string, moduleId: string` | `boolean` | |
| `install` | `companyId: string, moduleId: string, userId?: string` | `CompanyInstalledModule` | |
| `uninstall` | `companyId: string, moduleId: string` | `void` | |
| `getCompaniesUsingModule` | `moduleId: string` | `number` | Count |
| `getInstalledModuleSlugs` | `companyId: string` | `string[]` | For dependency checking |

---

## Step 2.8: Create Barrel Export for Template Repositories

**File**: `src/api/repositories/postgres/template/index.ts`

**Task**: Create barrel export.

```typescript
export * from './crm-template.repository';
export * from './crm-template-module.repository';
export * from './crm-template-blueprint-object.repository';
export * from './crm-template-blueprint-field.repository';
export * from './crm-template-blueprint-association.repository';
export * from './company-template.repository';
export * from './company-installed-module.repository';
```

---

# PHASE 3: Admin API - Templates CRUD

---

## Step 3.1: Create Admin Templates Module Structure

**Task**: Create folder structure and module file.

**Create folders**:
```
src/api/admin/templates/
├── dto/
├── templates.module.ts
├── templates.controller.ts
└── templates.service.ts
```

**File**: `src/api/admin/templates/templates.module.ts`

**Imports**:
- TypeOrmModule with all template entities
- All template repositories

**Exports**:
- TemplatesService (for use in installation)

---

## Step 3.2: Create Template DTOs

**Folder**: `src/api/admin/templates/dto/`

**Files to create**:

### `create-template.dto.ts`
```typescript
{
  name: string;        // Required, 1-255 chars
  slug: string;        // Required, lowercase, unique
  description?: string;
  icon?: string;
  isActive?: boolean;  // Default true
  displayOrder?: number;
}
```

### `update-template.dto.ts`
```typescript
{
  name?: string;
  description?: string;
  icon?: string;
  isActive?: boolean;
  displayOrder?: number;
}
// Note: slug not updatable
```

### `template-response.dto.ts`
```typescript
{
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  isActive: boolean;
  displayOrder: number;
  modulesCount: number;
  companiesCount: number;  // How many companies use this
  createdAt: Date;
  updatedAt: Date;
}
```

### `template-list-response.dto.ts`
```typescript
{
  result: TemplateResponseDto[];
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  limit: number;
  offset: number;
}
```

### `get-templates-query.dto.ts`
```typescript
{
  limit: number;      // Required
  offset: number;     // Required
  searchQuery?: string;
  isActive?: boolean;
}
```

**Notes**:
- Use `@ApiProperty()` on all fields
- Use `class-validator` decorators
- Use `@ApiPropertyOptional()` for optional fields

---

## Step 3.3: Create Templates Controller

**File**: `src/api/admin/templates/templates.controller.ts`

**Endpoints**:

| Method | Path | Auth | Body/Query | Response | Notes |
|--------|------|------|------------|----------|-------|
| GET | `/` | AdminGuard | `GetTemplatesQueryDto` | `TemplateListResponseDto` | List all templates |
| POST | `/` | AdminGuard | `CreateTemplateDto` | `{ id: string }` | Create template |
| GET | `/:id` | AdminGuard | - | `TemplateResponseDto` | Get single |
| GET | `/slug/:slug` | AdminGuard | - | `TemplateResponseDto` | Get by slug |
| GET | `/slug/:slug/available` | AdminGuard | - | `{ available: boolean }` | Check slug |
| PATCH | `/:id` | AdminGuard | `UpdateTemplateDto` | `{ message: string }` | Update |
| DELETE | `/:id` | AdminGuard | - | `{ message: string }` | Delete (if unused) |

**Notes**:
- Use `@ApiTags('Admin - Templates')`
- Use existing `AdminAuthGuard` or `RolesGuard`

---

## Step 3.4: Create Templates Service

**File**: `src/api/admin/templates/templates.service.ts`

**Task**: Thin service delegating to repository.

**Methods**:
- `getAll(query)` → delegates to `templateRepo.findAll()`
- `getById(id)` → delegates to `templateRepo.findOne()`
- `getBySlug(slug)` → delegates to `templateRepo.findBySlug()`
- `checkSlugAvailable(slug)` → delegates to `templateRepo.isSlugAvailable()`
- `create(dto)` → delegates to `templateRepo.createTemplate()`
- `update(id, dto)` → delegates to `templateRepo.updateTemplate()`
- `delete(id)` → check usage, then `templateRepo.deleteTemplate()`

---

# PHASE 4: Admin API - Modules CRUD

---

## Step 4.1: Create Admin Template Modules Structure

**Task**: Create module management under templates.

**Option A**: Nested under templates
```
src/api/admin/templates/
├── modules/
│   ├── dto/
│   ├── template-modules.controller.ts
│   └── template-modules.service.ts
```

**Option B**: Separate module (recommended for clarity)
```
src/api/admin/template-modules/
├── dto/
├── template-modules.module.ts
├── template-modules.controller.ts
└── template-modules.service.ts
```

Choose **Option B** - cleaner separation.

---

## Step 4.2: Create Module DTOs

**Folder**: `src/api/admin/template/modules/dto/`

### `create-template-module.dto.ts`
```typescript
{
  templateId: string;    // Required, UUID
  name: string;          // Required
  slug: string;          // Required, unique within template
  description?: string;
  isCore?: boolean;      // Default false
  dependsOn?: string[];  // Module slugs
  conflictsWith?: string[];
  displayOrder?: number;
}
```

### `update-template-module.dto.ts`
```typescript
{
  name?: string;
  description?: string;
  isCore?: boolean;
  dependsOn?: string[];
  conflictsWith?: string[];
  displayOrder?: number;
}
// Note: slug not updatable
```

### `module-response.dto.ts`
```typescript
{
  id: string;
  templateId: string;
  name: string;
  slug: string;
  description: string | null;
  isCore: boolean;
  dependsOn: string[];
  conflictsWith: string[];
  displayOrder: number;
  objectsCount: number;
  associationsCount: number;
  companiesInstalled: number;
  createdAt: Date;
}
```

### `get-modules-query.dto.ts`
```typescript
{
  templateId: string;   // Required
  limit: number;
  offset: number;
}
```

---

## Step 4.3: Create Template Modules Controller

**File**: `src/api/admin/template/modules/template-modules.controller.ts`

**Endpoints**:

| Method | Path | Body/Query | Response | Notes |
|--------|------|------------|----------|-------|
| GET | `/` | `GetModulesQueryDto` | `ModuleListResponseDto` | List modules for template |
| POST | `/` | `CreateTemplateModuleDto` | `{ id: string }` | Create module |
| GET | `/:id` | - | `ModuleResponseDto` | Get single |
| GET | `/:id/full` | - | Module + objects + fields + assocs | Full tree |
| PATCH | `/:id` | `UpdateTemplateModuleDto` | `{ message }` | Update |
| DELETE | `/:id` | - | `{ message }` | Delete (if no companies) |
| POST | `/:templateId/reorder` | `{ orderedIds: string[] }` | `{ message }` | Reorder |

---

## Step 4.4: Create Template Modules Service

**File**: `src/api/admin/template/modules/template-modules.service.ts`

Thin wrapper delegating to `CrmTemplateModuleRepository`.

---

# PHASE 5: Admin API - Blueprint Objects CRUD

---

## Step 5.1: Create Blueprint Objects Module

**Folder**: `src/api/admin/template/blueprint-objects/`

---

## Step 5.2: Create Blueprint Object DTOs

### `create-blueprint-object.dto.ts`
```typescript
{
  moduleId: string;           // Required
  name: string;               // Required
  apiName: string;            // Required, must start with _
  description?: string;
  protection?: TemplateItemProtection;  // Default NONE
  displayOrder?: number;
}
```

### `update-blueprint-object.dto.ts`
```typescript
{
  name?: string;
  description?: string;
  protection?: TemplateItemProtection;
  displayOrder?: number;
}
// Note: apiName not updatable
```

### `blueprint-object-response.dto.ts`
```typescript
{
  id: string;
  moduleId: string;
  name: string;
  apiName: string;
  description: string | null;
  protection: TemplateItemProtection;
  displayOrder: number;
  fieldsCount: number;
  createdAt: Date;
}
```

---

## Step 5.3: Create Blueprint Objects Controller

**Endpoints**:

| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/` | List | Query: moduleId |
| POST | `/` | `{ id }` | Create |
| GET | `/:id` | Object | Single |
| GET | `/:id/with-fields` | Object + fields | |
| PATCH | `/:id` | `{ message }` | Update |
| DELETE | `/:id` | `{ message }` | Delete |
| POST | `/:moduleId/reorder` | `{ message }` | Reorder |

---

# PHASE 6: Admin API - Blueprint Fields CRUD

---

## Step 6.1: Create Blueprint Fields Module

**Folder**: `src/api/admin/template/blueprint-fields/`

---

## Step 6.2: Create Blueprint Field DTOs

### `create-blueprint-field.dto.ts`
```typescript
{
  blueprintObjectId: string;
  name: string;
  apiName: string;            // Must start with _
  fieldType: FieldType;
  description?: string;
  isRequired?: boolean;
  shape?: Record<string, any>;
  configShape?: Record<string, any>;
  protection?: TemplateItemProtection;
  displayOrder?: number;
}
```

### `bulk-create-blueprint-fields.dto.ts`
```typescript
{
  blueprintObjectId: string;
  fields: CreateBlueprintFieldDto[];
}
```

---

## Step 6.3: Create Blueprint Fields Controller

**Endpoints**:

| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/` | List | Query: blueprintObjectId |
| POST | `/` | `{ id }` | Create single |
| POST | `/bulk` | `{ ids: string[] }` | Create multiple |
| GET | `/:id` | Field | Single |
| PATCH | `/:id` | `{ message }` | Update |
| DELETE | `/:id` | `{ message }` | Delete |
| POST | `/:objectId/reorder` | `{ message }` | Reorder |

---

# PHASE 7: Admin API - Blueprint Associations CRUD

---

## Step 7.1: Create Blueprint Associations Module

**Folder**: `src/api/admin/template/blueprint-associations/`

---

## Step 7.2: Create Blueprint Association DTOs

### `create-blueprint-association.dto.ts`
```typescript
{
  moduleId: string;
  name: string;
  apiName: string;                // Must start with _
  sourceObjectApiName: string;    // _contact
  targetObjectApiName: string;    // _company
  sourceCardinality: AssociationCardinality;
  targetCardinality: AssociationCardinality;
  isBidirectional?: boolean;      // Default true
  reverseName?: string;
  description?: string;
  protection?: TemplateItemProtection;
  displayOrder?: number;
}
```

---

## Step 7.3: Create Blueprint Associations Controller

**Endpoints**:

| Method | Path | Response | Notes |
|--------|------|----------|-------|
| GET | `/` | List | Query: moduleId |
| POST | `/` | `{ id }` | Create (validate object apiNames exist) |
| GET | `/:id` | Association | Single |
| PATCH | `/:id` | `{ message }` | Update |
| DELETE | `/:id` | `{ message }` | Delete |

---

# PHASE 8: Template Installation Service

---

## Step 8.1: Create Installation Service

**File**: `src/api/admin/templates/installation/template-installation.service.ts`

**Task**: Core service that "stamps" blueprints into real entities.

**Methods**:

### `installTemplate(companyId, templateSlug, modulesSlugs[])`

**Flow**:
1. Load template by slug with full tree
2. Determine modules to install:
   - All `isCore: true` modules
   - Plus requested modules from `modulesSlugs`
3. Validate dependencies satisfied
4. Validate no conflicts
5. For each module (in order):
   - For each blueprint object:
     - Create `CrmObjectType` with `templateOriginId` and `protection`
     - Store mapping: `apiName` → `realObjectTypeId`
     - For each blueprint field:
       - Create `CrmObjectField` with `templateOriginId` and `protection`
   - For each blueprint association:
     - Resolve `sourceObjectApiName` → real UUID
     - Resolve `targetObjectApiName` → real UUID
     - Create `CrmAssociationType` with `templateOriginId` and `protection`
   - Record `CompanyInstalledModule`
6. Record `CompanyTemplate`
7. Return summary

### `installModule(companyId, moduleSlug)`

For adding a single module later.

**Flow**:
1. Check company has template installed
2. Load module
3. Validate dependencies (check installed modules)
4. Run installation for just this module
5. Record `CompanyInstalledModule`

### `uninstallModule(companyId, moduleSlug)`

**Flow**:
1. Check module is not `isCore`
2. Check no other installed modules depend on it
3. Count affected records (CrmObjects using these types)
4. If count > 0, return warning (let caller confirm)
5. Delete:
   - `CrmObjectAssociation` records
   - `CrmObject` records
   - `CrmAssociationType` records (where templateOriginId matches)
   - `CrmObjectField` records
   - `CrmObjectType` records
   - `CompanyInstalledModule` row

---

## Step 8.2: Create Installation DTOs

### `install-template.dto.ts`
```typescript
{
  companyId: string;
  templateSlug: string;
  modules?: string[];     // If empty, install only core modules
  installAllModules?: boolean;  // Override: install everything
}
```

### `install-module.dto.ts`
```typescript
{
  companyId: string;
  moduleSlug: string;
}
```

### `installation-result.dto.ts`
```typescript
{
  success: boolean;
  templateSlug: string;
  installedModules: string[];
  createdObjectTypes: number;
  createdFields: number;
  createdAssociations: number;
  errors?: string[];
}
```

---

## Step 8.3: Add Installation Endpoints to Templates Controller

**Add to**: `src/api/admin/templates/templates.controller.ts`

| Method | Path | Body | Response | Notes |
|--------|------|------|----------|-------|
| POST | `/install` | `InstallTemplateDto` | `InstallationResultDto` | Install template for company |
| POST | `/install-module` | `InstallModuleDto` | `InstallationResultDto` | Add module |
| POST | `/uninstall-module` | `UninstallModuleDto` | `{ message, deletedCount }` | Remove module |
| GET | `/company/:companyId` | - | Company's template + modules | What's installed |

---

# PHASE 9: Protection Enforcement

---

## Step 9.1: Update CrmObjectType Repository

**File**: `src/api/repositories/postgres/object/crm-object-type.repository.ts`

**Modify `delete` method**:

```typescript
async deleteObjectType(id: string): Promise<void> {
  const objectType = await this.findOne({ where: { id } });

  if (!objectType) {
    throw new NotFoundException('Object type not found');
  }

  // Check protection
  if (objectType.protection === TemplateItemProtection.FULL ||
      objectType.protection === TemplateItemProtection.DELETE_PROTECTED) {
    throw new ForbiddenException(
      'Cannot delete this object type - it is protected by template'
    );
  }

  // Proceed with delete
  await this.remove(objectType);
}
```

---

## Step 9.2: Update CrmObjectField Repository

**File**: `src/api/repositories/postgres/object/crm-object-field.repository.ts`

**Modify `delete` method** - same pattern as above.

---

## Step 9.3: Update CrmAssociationType Repository

**File**: `src/api/repositories/postgres/object/crm-association-type.repository.ts`

**Modify `delete` method** - same pattern as above.

---

## Step 9.4: Update Update Methods (Optional)

For `FULL` protection, you might also want to prevent updates:

```typescript
async updateField(id: string, dto: UpdateDto): Promise<void> {
  const field = await this.findOne({ where: { id } });

  if (field.protection === TemplateItemProtection.FULL) {
    throw new ForbiddenException(
      'Cannot modify this field - it is fully protected by template'
    );
  }

  // Proceed with update
}
```

---

# PHASE 11: Integration with Registration

---

## Step 11.1: Update Registration Service

**File**: `src/api/client/auth/auth.service.ts` (or wherever registration lives)

**Modify registration flow**:

```typescript
async register(dto: RegisterDto): Promise<AuthResult> {
  // 1. Create company
  const company = await this.companyRepo.save({ name: dto.companyName });

  // 2. Create user
  const user = await this.userRepo.save({
    email: dto.email,
    password: await hash(dto.password),
    company,
    role: UserRole.ADMIN,
  });

  // 3. AUTO-INSTALL DEFAULT TEMPLATE (NEW)
  await this.templateInstallationService.installTemplate({
    companyId: company.id,
    templateSlug: DEFAULT_TEMPLATE_SLUG,  // 'movers_properties'
    installAllModules: true,
  });

  // 4. Generate token
  const token = this.generateToken(user);

  return { user, token };
}
```

---

## Step 11.2: Create Default Template Config

**File**: `src/api/config/default-template.config.ts`

```typescript
export const DEFAULT_TEMPLATE = {
  slug: 'movers_properties',
  installAllModules: true,
};
```

---

# PHASE 12: Client API (If Needed)

---

## Step 12.1: Create Client Template Endpoints

**Folder**: `src/api/client/templates/`

**Endpoints** (minimal for MVP):

| Method | Path | Auth | Response | Notes |
|--------|------|------|----------|-------|
| GET | `/my-template` | UserAuth | Template + installed modules | What company has |
| GET | `/available-modules` | UserAuth | Modules not yet installed | For future module picker |

This is optional for MVP since we auto-install everything.

---

# Summary Checklist

## Phase 1: Foundation
- [ ] Step 1.1: Protection enum
- [ ] Step 1.2: CrmTemplate entity
- [ ] Step 1.3: CrmTemplateModule entity
- [ ] Step 1.4: CrmTemplateBlueprintObject entity
- [ ] Step 1.5: CrmTemplateBlueprintField entity
- [ ] Step 1.6: CrmTemplateBlueprintAssociation entity
- [ ] Step 1.7: CompanyTemplate entity
- [ ] Step 1.8: CompanyInstalledModule entity
- [ ] Step 1.9: Update existing entities
- [ ] Step 1.10: Barrel exports

## Phase 2: Repositories
- [ ] Step 2.1: CrmTemplateRepository
- [ ] Step 2.2: CrmTemplateModuleRepository
- [ ] Step 2.3: BlueprintObjectRepository
- [ ] Step 2.4: BlueprintFieldRepository
- [ ] Step 2.5: BlueprintAssociationRepository
- [ ] Step 2.6: CompanyTemplateRepository
- [ ] Step 2.7: CompanyInstalledModuleRepository
- [ ] Step 2.8: Barrel exports

## Phase 3: Admin Templates CRUD
- [ ] Step 3.1: Module structure
- [ ] Step 3.2: Template DTOs
- [ ] Step 3.3: Templates controller
- [ ] Step 3.4: Templates service

## Phase 4: Admin Modules CRUD
- [ ] Step 4.1-4.4: Template modules CRUD

## Phase 5: Blueprint Objects CRUD
- [ ] Step 5.1-5.3: Blueprint objects CRUD

## Phase 6: Blueprint Fields CRUD
- [ ] Step 6.1-6.3: Blueprint fields CRUD

## Phase 7: Blueprint Associations CRUD
- [ ] Step 7.1-7.3: Blueprint associations CRUD

## Phase 8: Installation Service
- [ ] Step 8.1: Installation service
- [ ] Step 8.2: Installation DTOs
- [ ] Step 8.3: Installation endpoints

## Phase 9: Protection
- [ ] Step 9.1-9.4: Protection enforcement

## Phase 10: Seeds
- [ ] Step 10.1-10.4: Seed data

## Phase 11: Registration Integration
- [ ] Step 11.1-11.2: Auto-install on registration

## Phase 12: Client API (Optional)
- [ ] Step 12.1: Client endpoints
