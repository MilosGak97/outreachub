# Feature Development Template - EXAMPLE (v2)

> **This is a filled example** showing how to apply the vertical slice approach to the Template Management system.

---

## 📋 Feature Overview

| Field | Value |
|-------|-------|
| **Feature Name** | Template Management System |
| **Started** | 2024-01-15 |
| **Target Completion** | 2024-02-01 |
| **Status** | 🟡 In Progress |
| **Complexity** | Complex (25+ endpoints) |

### User Story

```
AS AN admin user
I WANT TO create, install, and manage reusable templates with modules and fields
SO THAT I can quickly set up new companies with predefined structures
```

### One-Sentence Summary
> Admins can create template "blueprints" containing modules, objects, and fields, then install them on company accounts.

---

## 🎯 Acceptance Criteria

- [ ] Admin can create a complete template with modules, objects, and fields
- [ ] Admin can install a template to a company
- [ ] Admin can view and edit existing templates
- [ ] Admin can delete templates (with proper safeguards)
- [ ] Admin can reorder modules, objects, and fields

---

# PHASE 1: Define & Design

## 1.1 User Flow Map

```
[Admin Dashboard]
       ↓
[Click "New Template"]
       ↓
[Enter name + slug] ──→ [Slug taken?] ──→ [Show error, suggest alt]
       ↓
[Template created, enter editor]
       ↓
[Add Module "Sales"]
       ↓
[Add Object "Deal" to Sales]
       ↓
[Add Fields to Deal: name, value, stage]
       ↓
[Add Object "Contact" to Sales]
       ↓
[Add Fields to Contact: firstName, lastName, email]
       ↓
[Add Association: Deal → Contact]
       ↓
[Click "Install to Company"]
       ↓
[Select Company ABC]
       ↓
[Confirm] ──→ [Already installed?] ──→ [Show error]
       ↓
[Success! Redirect to company]
```

---

## 1.2 Endpoint Inventory

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /admin/templates | Create template |
| GET | /admin/templates | List templates |
| GET | /admin/templates/{id} | Get template |
| PATCH | /admin/templates/{id} | Update template |
| DELETE | /admin/templates/{id} | Delete template |
| GET | /admin/templates/slug/{slug} | Get by slug |
| GET | /admin/templates/slug/{slug}/available | Check slug |
| POST | /admin/templates/install | Install to company |
| POST | /admin/templates/install-module | Install module |
| POST | /admin/templates/uninstall-module | Uninstall module |
| GET | /admin/templates/company/{companyId} | Installation status |
| GET | /admin/templates/modules | List modules |
| POST | /admin/templates/modules | Create module |
| GET | /admin/templates/modules/{id} | Get module |
| PATCH | /admin/templates/modules/{id} | Update module |
| DELETE | /admin/templates/modules/{id} | Delete module |
| GET | /admin/templates/modules/{id}/full | Get with tree |
| POST | /admin/templates/modules/{templateId}/reorder | Reorder |
| GET | /admin/templates/blueprint-objects | List objects |
| POST | /admin/templates/blueprint-objects | Create object |
| GET | /admin/templates/blueprint-objects/{id} | Get object |
| GET | /admin/templates/blueprint-objects/{id}/with-fields | Get with fields |
| PATCH | /admin/templates/blueprint-objects/{id} | Update object |
| DELETE | /admin/templates/blueprint-objects/{id} | Delete object |
| POST | /admin/templates/blueprint-objects/{moduleId}/reorder | Reorder |
| GET | /admin/templates/blueprint-fields | List fields |
| POST | /admin/templates/blueprint-fields | Create field |
| POST | /admin/templates/blueprint-fields/bulk | Bulk create |
| GET | /admin/templates/blueprint-fields/{id} | Get field |
| PATCH | /admin/templates/blueprint-fields/{id} | Update field |
| DELETE | /admin/templates/blueprint-fields/{id} | Delete field |
| POST | /admin/templates/blueprint-fields/{objectId}/reorder | Reorder |
| GET | /admin/templates/blueprint-associations | List associations |
| POST | /admin/templates/blueprint-associations | Create association |
| GET | /admin/templates/blueprint-associations/{id} | Get association |
| PATCH | /admin/templates/blueprint-associations/{id} | Update association |
| DELETE | /admin/templates/blueprint-associations/{id} | Delete association |

---

## 1.3 Endpoint Grouping (By Flow)

### 🟢 Group 1: CREATE Chain (Minimum Viable Flow)

> After this group: Admin can create and install a complete template.

| Order | Method | Endpoint | Purpose | Depends On |
|-------|--------|----------|---------|------------|
| 1 | GET | /templates/slug/{slug}/available | Check slug first | — |
| 2 | POST | /templates | Create template | — |
| 3 | POST | /modules | Create module | Step 2 (templateId) |
| 4 | POST | /blueprint-objects | Create object | Step 3 (moduleId) |
| 5 | POST | /blueprint-fields | Create field | Step 4 (objectId) |
| 6 | POST | /blueprint-fields/bulk | Bulk create fields | Step 4 (objectId) |
| 7 | POST | /blueprint-associations | Create association | Step 4 (objectIds) |
| 8 | POST | /install | Install to company | Step 2 (templateId) |
| 9 | GET | /company/{companyId} | Verify installation | Step 8 |

**Test Flow After Group 1:**
```
1. Check slug "crm-basic" available → expect { available: true }
2. Create template "CRM Basic" → expect 201 + { id: "tpl_123" }
3. Create module "Sales" for tpl_123 → expect 201 + { id: "mod_456" }
4. Create object "Deal" for mod_456 → expect 201 + { id: "obj_789" }
5. Bulk create fields for obj_789 → expect 201 + 3 fields created
6. Create object "Contact" for mod_456 → expect 201 + { id: "obj_790" }
7. Bulk create fields for obj_790 → expect 201 + 3 fields created
8. Create association Deal → Contact → expect 201
9. Install tpl_123 to company_abc → expect 201
10. Check company_abc status → expect { isInstalled: true }
```

---

### 🔵 Group 2: READ Operations

> After this group: Admin can view templates, drill down into details.

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| GET | /templates | List all templates | P1 |
| GET | /templates/{id} | Get single template | P1 |
| GET | /templates/slug/{slug} | Get template by slug | P1 |
| GET | /modules | List modules (filter by templateId) | P1 |
| GET | /modules/{id} | Get single module | P1 |
| GET | /modules/{id}/full | Get module with complete tree | P1 |
| GET | /blueprint-objects | List objects | P1 |
| GET | /blueprint-objects/{id} | Get single object | P2 |
| GET | /blueprint-objects/{id}/with-fields | Get object with fields | P1 |
| GET | /blueprint-fields | List fields | P2 |
| GET | /blueprint-fields/{id} | Get single field | P2 |
| GET | /blueprint-associations | List associations | P1 |
| GET | /blueprint-associations/{id} | Get single association | P2 |

---

### 🟡 Group 3: UPDATE Operations

> After this group: Admin can edit templates without recreating.

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| PATCH | /templates/{id} | Update template name/description | P1 |
| PATCH | /modules/{id} | Update module | P1 |
| PATCH | /blueprint-objects/{id} | Update object | P1 |
| PATCH | /blueprint-fields/{id} | Update field | P1 |
| PATCH | /blueprint-associations/{id} | Update association | P2 |

---

### 🔴 Group 4: DELETE Operations

> After this group: Admin can clean up mistakes.
> Order: Delete children first (no dependencies), parents last (have dependencies).

| Order | Method | Endpoint | Cascade Behavior | Priority |
|-------|--------|----------|------------------|----------|
| 1 | DELETE | /blueprint-fields/{id} | None | P2 |
| 2 | DELETE | /blueprint-associations/{id} | None | P2 |
| 3 | DELETE | /blueprint-objects/{id} | Cascades: delete fields | P2 |
| 4 | DELETE | /modules/{id} | Cascades: delete objects + fields | P2 |
| 5 | DELETE | /templates/{id} | BLOCKED if installed anywhere | P2 |

---

### ⚪ Group 5: Utilities & Edge Cases

> After this group: Admin has full control over ordering and partial installs.

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| POST | /modules/{templateId}/reorder | Reorder modules | P3 |
| POST | /blueprint-objects/{moduleId}/reorder | Reorder objects | P3 |
| POST | /blueprint-fields/{objectId}/reorder | Reorder fields | P3 |
| POST | /install-module | Add module to existing install | P3 |
| POST | /uninstall-module | Remove module from install | P3 |

---

## 1.4 Data Models & Types

### Entities (TypeORM Classes)

> Located in `src/api/entities/templates/`
> 
> **Note:** Imports omitted for readability. Enums are in `src/api/enums/`.

```typescript
// ============================================
// crm-template.entity.ts
// ============================================

@Entity('crm_template')
export class CrmTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon?: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @OneToMany(() => CrmTemplateModule, (module) => module.template, { cascade: true })
  modules?: CrmTemplateModule[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ============================================
// crm-template-module.entity.ts
// ============================================

@Entity('crm_template_module')
@Index(['templateId', 'slug'], { unique: true })
export class CrmTemplateModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @ManyToOne(() => CrmTemplate, (template) => template.modules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: CrmTemplate;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Index()
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_core', type: 'boolean', default: false })
  isCore: boolean;

  @Column({ name: 'depends_on', type: 'simple-array', nullable: true, default: [] })
  dependsOn?: string[];

  @Column({ name: 'conflicts_with', type: 'simple-array', nullable: true, default: [] })
  conflictsWith?: string[];

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @OneToMany(() => CrmTemplateBlueprintObject, (object) => object.module, { cascade: true })
  blueprintObjects?: CrmTemplateBlueprintObject[];

  @OneToMany(() => CrmTemplateBlueprintAssociation, (assoc) => assoc.module, { cascade: true })
  blueprintAssociations?: CrmTemplateBlueprintAssociation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// ============================================
// crm-template-blueprint-object.entity.ts
// ============================================

@Entity('crm_template_blueprint_object')
@Index(['moduleId', 'apiName'], { unique: true })
export class CrmTemplateBlueprintObject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'module_id', type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => CrmTemplateModule, (module) => module.blueprintObjects, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: CrmTemplateModule;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'api_name', type: 'varchar', length: 100 })
  apiName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TemplateItemProtection,
    enumName: TemplateItemProtectionEnumName,
    default: TemplateItemProtection.NONE,
  })
  protection: TemplateItemProtection;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @OneToMany(() => CrmTemplateBlueprintField, (field) => field.blueprintObject, { cascade: true })
  fields?: CrmTemplateBlueprintField[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// ============================================
// crm-template-blueprint-field.entity.ts
// ============================================

@Entity('crm_template_blueprint_field')
@Index(['blueprintObjectId', 'apiName'], { unique: true })
export class CrmTemplateBlueprintField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'blueprint_object_id', type: 'uuid' })
  blueprintObjectId: string;

  @ManyToOne(() => CrmTemplateBlueprintObject, (object) => object.fields, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blueprint_object_id' })
  blueprintObject: CrmTemplateBlueprintObject;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'api_name', type: 'varchar', length: 100 })
  apiName: string;

  @Column({ name: 'field_type', type: 'enum', enum: FieldType, enumName: 'FieldType' })
  fieldType: FieldType;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired: boolean;

  @Column({ type: 'jsonb', nullable: true })
  shape?: Record<string, any>;  // Field-specific configuration

  @Column({ name: 'config_shape', type: 'jsonb', nullable: true })
  configShape?: Record<string, any>;  // Additional config

  @Column({
    type: 'enum',
    enum: TemplateItemProtection,
    enumName: TemplateItemProtectionEnumName,
    default: TemplateItemProtection.NONE,
  })
  protection: TemplateItemProtection;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// ============================================
// crm-template-blueprint-association.entity.ts
// ============================================

@Entity('crm_template_blueprint_association')
@Index(['moduleId', 'apiName'], { unique: true })
export class CrmTemplateBlueprintAssociation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'module_id', type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => CrmTemplateModule, (module) => module.blueprintAssociations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'module_id' })
  module: CrmTemplateModule;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'api_name', type: 'varchar', length: 100 })
  apiName: string;

  @Column({ name: 'source_object_api_name', type: 'varchar', length: 100 })
  sourceObjectApiName: string;

  @Column({ name: 'target_object_api_name', type: 'varchar', length: 100 })
  targetObjectApiName: string;

  @Column({
    name: 'source_cardinality',
    type: 'enum',
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
  })
  sourceCardinality: AssociationCardinality;

  @Column({
    name: 'target_cardinality',
    type: 'enum',
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
  })
  targetCardinality: AssociationCardinality;

  @Column({ name: 'is_bidirectional', type: 'boolean', default: true })
  isBidirectional: boolean;

  @Column({ name: 'reverse_name', type: 'varchar', length: 255, nullable: true })
  reverseName?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TemplateItemProtection,
    enumName: TemplateItemProtectionEnumName,
    default: TemplateItemProtection.NONE,
  })
  protection: TemplateItemProtection;

  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// ============================================
// company-template.entity.ts (Installation tracking)
// ============================================

@Entity('company_template')
@Index(['companyId'], { unique: true })
export class CompanyTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @ManyToOne(() => CrmTemplate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'template_id' })
  template: CrmTemplate;

  @CreateDateColumn({ name: 'installed_at' })
  installedAt: Date;

  @Column({ name: 'installed_by', type: 'uuid', nullable: true })
  installedBy?: string;
}

// ============================================
// company-installed-module.entity.ts (Per-module tracking)
// ============================================

@Entity('company_installed_module')
@Index(['companyId', 'moduleId'], { unique: true })
export class CompanyInstalledModule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @Column({ name: 'module_id', type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => CrmTemplateModule, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'module_id' })
  module: CrmTemplateModule;

  @CreateDateColumn({ name: 'installed_at' })
  installedAt: Date;

  @Column({ name: 'installed_by', type: 'uuid', nullable: true })
  installedBy?: string;
}
```

#### Entity Summary Table

| Entity | Table | Key Fields | Relations |
|--------|-------|------------|-----------|
| CrmTemplate | crm_template | slug (unique), isActive, displayOrder | → modules |
| CrmTemplateModule | crm_template_module | slug, isCore, dependsOn, conflictsWith | → template, → blueprintObjects, → blueprintAssociations |
| CrmTemplateBlueprintObject | crm_template_blueprint_object | apiName (unique per module), protection | → module, → fields |
| CrmTemplateBlueprintField | crm_template_blueprint_field | apiName (unique per object), fieldType, shape, protection | → blueprintObject |
| CrmTemplateBlueprintAssociation | crm_template_blueprint_association | apiName, sourceObjectApiName, targetObjectApiName, cardinalities | → module |
| CompanyTemplate | company_template | companyId (unique), templateId | → company, → template |
| CompanyInstalledModule | company_installed_module | companyId + moduleId (unique) | → company, → module |

#### Cascade Delete Chain

```
CrmTemplate (delete)
    ↓ CASCADE
CrmTemplateModule (deleted)
    ├─ ↓ CASCADE
    │  CrmTemplateBlueprintObject (deleted)
    │      ↓ CASCADE
    │      CrmTemplateBlueprintField (deleted)
    │
    └─ ↓ CASCADE
       CrmTemplateBlueprintAssociation (deleted)

Company (delete)
    ↓ CASCADE
    CompanyTemplate (deleted)
    CompanyInstalledModule (deleted)

CrmTemplate (delete when CompanyTemplate exists)
    ↓ RESTRICT - Blocked! Must uninstall from all companies first

CrmTemplateModule (delete when CompanyInstalledModule exists)
    ↓ RESTRICT - Blocked! Must uninstall module from all companies first
```

#### Key Design Decisions in Your Implementation

| Feature | Implementation | Why |
|---------|---------------|-----|
| Module dependencies | `dependsOn: string[]` | Modules can require other modules |
| Module conflicts | `conflictsWith: string[]` | Some modules are mutually exclusive |
| Protection levels | `TemplateItemProtection` enum | Control what users can modify |
| Flexible field config | `shape` + `configShape` JSONB | Different field types need different configs |
| Association cardinality | `sourceCardinality` + `targetCardinality` | More precise than simple "one-to-many" |
| Bidirectional option | `isBidirectional` + `reverseName` | Some associations are one-way |
| Per-module installation | `CompanyInstalledModule` | Track which modules each company has |
| Installation audit | `installedBy` field | Track who installed what |

---

### Enums (Centralized)

> Located in `src/api/enums/`

```typescript
// ============================================
// template/template-item-protection.enum.ts
// ============================================

export const TemplateItemProtectionEnumName = 'TemplateItemProtection';

export enum TemplateItemProtection {
  NONE = 'none',           // User can modify/delete
  LOCKED = 'locked',       // User cannot modify/delete
  HIDDEN = 'hidden',       // User cannot see
}

// ============================================
// object/association-cardinality.enum.ts
// ============================================

export enum AssociationCardinality {
  ONE = 'one',
  MANY = 'many',
}

// ============================================
// client/object-related/.../field-type.enum.ts
// ============================================

export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  DATETIME = 'datetime',
  BOOLEAN = 'boolean',
  SELECT = 'select',
  MULTISELECT = 'multiselect',
  TEXTAREA = 'textarea',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  // ... other field types as needed
}
```

#### Enum Usage Pattern

```typescript
// In entity - creates actual PostgreSQL enum type
@Column({
  type: 'enum',
  enum: TemplateItemProtection,
  enumName: TemplateItemProtectionEnumName,
  default: TemplateItemProtection.NONE,
})
protection: TemplateItemProtection;

// In Request DTO - validates input
@IsEnum(TemplateItemProtection)
protection: TemplateItemProtection;

// In Response DTO - documents in Swagger
@ApiProperty({
  enum: TemplateItemProtection,
  enumName: TemplateItemProtectionEnumName,
})
protection: TemplateItemProtection;
```

---

### Request DTOs (Validation Classes)

> These go in each sub-feature's `dto/requests/` folder.
> 
> **Note:** Imports omitted for readability.

```typescript
// ============================================
// templates/dto/requests/create-crm-template.dto.ts
// ============================================

export class CreateCrmTemplateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with dashes'
  })
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  icon?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @IsOptional()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// templates/dto/requests/update-crm-template.dto.ts
// ============================================

export class UpdateCrmTemplateDto extends PartialType(CreateCrmTemplateDto) {}

// ============================================
// modules/dto/requests/create-crm-template-module.dto.ts
// ============================================

export class CreateCrmTemplateModuleDto {
  @IsUUID()
  templateId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isCore?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dependsOn?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  conflictsWith?: string[];

  @IsInt()
  @IsOptional()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// blueprint-objects/dto/requests/create-blueprint-object.dto.ts
// ============================================

export class CreateCrmTemplateBlueprintObjectDto {
  @IsUUID()
  moduleId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z][a-zA-Z0-9]*$/, {
    message: 'apiName must be camelCase starting with lowercase letter'
  })
  apiName: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TemplateItemProtection)
  @IsOptional()
  protection?: TemplateItemProtection;

  @IsInt()
  @IsOptional()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// blueprint-fields/dto/requests/create-blueprint-field.dto.ts
// ============================================

export class CreateCrmTemplateBlueprintFieldDto {
  @IsUUID()
  blueprintObjectId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z][a-zA-Z0-9]*$/)
  apiName: string;

  @IsEnum(FieldType)
  fieldType: FieldType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsObject()
  @IsOptional()
  shape?: Record<string, any>;

  @IsObject()
  @IsOptional()
  configShape?: Record<string, any>;

  @IsEnum(TemplateItemProtection)
  @IsOptional()
  protection?: TemplateItemProtection;

  @IsInt()
  @IsOptional()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// blueprint-fields/dto/requests/bulk-create-fields.dto.ts
// ============================================

export class BulkFieldItemDto extends OmitType(
  CreateCrmTemplateBlueprintFieldDto, 
  ['blueprintObjectId'] as const
) {}

export class BulkCreateBlueprintFieldsDto {
  @IsUUID()
  blueprintObjectId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkFieldItemDto)
  @ArrayMaxSize(50, { message: 'Maximum 50 fields per bulk create' })
  fields: BulkFieldItemDto[];
}

// ============================================
// blueprint-associations/dto/requests/create-blueprint-association.dto.ts
// ============================================

export class CreateCrmTemplateBlueprintAssociationDto {
  @IsUUID()
  moduleId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z][a-zA-Z0-9]*$/)
  apiName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sourceObjectApiName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  targetObjectApiName: string;

  @IsEnum(AssociationCardinality)
  sourceCardinality: AssociationCardinality;

  @IsEnum(AssociationCardinality)
  targetCardinality: AssociationCardinality;

  @IsBoolean()
  @IsOptional()
  isBidirectional?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  reverseName?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(TemplateItemProtection)
  @IsOptional()
  protection?: TemplateItemProtection;

  @IsInt()
  @IsOptional()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// templates/dto/requests/install-template.dto.ts
// ============================================

export class InstallTemplateDto {
  @IsUUID()
  templateId: string;

  @IsUUID()
  companyId: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  moduleIds?: string[];  // If not provided, install all non-conflicting modules
}

export class InstallModuleDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  moduleId: string;
}

export class UninstallModuleDto {
  @IsUUID()
  companyId: string;

  @IsUUID()
  moduleId: string;
}

// ============================================
// Shared: reorder.dto.ts
// ============================================

export class ReorderDto {
  @IsArray()
  @IsUUID('4', { each: true })
  orderedIds: string[];
}
```

---

### Response DTOs (Swagger/OpenAPI)

> Classes with `@ApiProperty()` for Swagger documentation.
> Used with `@ApiOkResponse({ type: XxxResponseDto })` in controllers.
> 
> **Note:** Imports omitted for readability.

```typescript
// ============================================
// templates/dto/responses/crm-template-response.dto.ts
// ============================================

export class CrmTemplateResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'CRM Basic' })
  name: string;

  @ApiProperty({ example: 'crm-basic' })
  slug: string;

  @ApiPropertyOptional({ example: 'A basic CRM template', nullable: true })
  description?: string;

  @ApiPropertyOptional({ example: 'mdi-briefcase', nullable: true })
  icon?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 0 })
  displayOrder: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

// ============================================
// templates/dto/responses/crm-template-list-item.dto.ts
// ============================================

export class CrmTemplateListItemDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'CRM Basic' })
  name: string;

  @ApiProperty({ example: 'crm-basic' })
  slug: string;

  @ApiPropertyOptional({ example: 'mdi-briefcase' })
  icon?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: 3, description: 'Number of modules' })
  moduleCount: number;
}

// ============================================
// modules/dto/responses/crm-template-module-response.dto.ts
// ============================================

export class CrmTemplateModuleResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440000' })
  templateId: string;

  @ApiProperty({ example: 'Sales' })
  name: string;

  @ApiProperty({ example: 'sales' })
  slug: string;

  @ApiPropertyOptional({ example: 'Sales pipeline management', nullable: true })
  description?: string;

  @ApiProperty({ example: true })
  isCore: boolean;

  @ApiPropertyOptional({ type: [String], example: ['contacts'] })
  dependsOn?: string[];

  @ApiPropertyOptional({ type: [String], example: ['marketing'] })
  conflictsWith?: string[];

  @ApiProperty({ example: 0 })
  displayOrder: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

// ============================================
// blueprint-objects/dto/responses/blueprint-object-response.dto.ts
// ============================================

export class CrmTemplateBlueprintObjectResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440000' })
  moduleId: string;

  @ApiProperty({ example: 'Deal' })
  name: string;

  @ApiProperty({ example: 'deal' })
  apiName: string;

  @ApiPropertyOptional({ example: 'Represents a sales opportunity', nullable: true })
  description?: string;

  @ApiProperty({ enum: TemplateItemProtection, enumName: TemplateItemProtectionEnumName })
  protection: TemplateItemProtection;

  @ApiProperty({ example: 0 })
  displayOrder: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;
}

// ============================================
// blueprint-fields/dto/responses/blueprint-field-response.dto.ts
// ============================================

export class CrmTemplateBlueprintFieldResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440000' })
  blueprintObjectId: string;

  @ApiProperty({ example: 'Deal Name' })
  name: string;

  @ApiProperty({ example: 'dealName' })
  apiName: string;

  @ApiProperty({ enum: FieldType, enumName: 'FieldType' })
  fieldType: FieldType;

  @ApiPropertyOptional({ example: 'Name of the deal', nullable: true })
  description?: string;

  @ApiProperty({ example: true })
  isRequired: boolean;

  @ApiPropertyOptional({ description: 'Field-specific configuration' })
  shape?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional configuration' })
  configShape?: Record<string, any>;

  @ApiProperty({ enum: TemplateItemProtection, enumName: TemplateItemProtectionEnumName })
  protection: TemplateItemProtection;

  @ApiProperty({ example: 0 })
  displayOrder: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;
}

// ============================================
// blueprint-associations/dto/responses/blueprint-association-response.dto.ts
// ============================================

export class CrmTemplateBlueprintAssociationResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440000' })
  moduleId: string;

  @ApiProperty({ example: 'Deal Contacts' })
  name: string;

  @ApiProperty({ example: 'dealContacts' })
  apiName: string;

  @ApiProperty({ example: 'deal' })
  sourceObjectApiName: string;

  @ApiProperty({ example: 'contact' })
  targetObjectApiName: string;

  @ApiProperty({ enum: AssociationCardinality, enumName: 'AssociationCardinality' })
  sourceCardinality: AssociationCardinality;

  @ApiProperty({ enum: AssociationCardinality, enumName: 'AssociationCardinality' })
  targetCardinality: AssociationCardinality;

  @ApiProperty({ example: true })
  isBidirectional: boolean;

  @ApiPropertyOptional({ example: 'Contact Deals', nullable: true })
  reverseName?: string;

  @ApiPropertyOptional({ nullable: true })
  description?: string;

  @ApiProperty({ enum: TemplateItemProtection, enumName: TemplateItemProtectionEnumName })
  protection: TemplateItemProtection;

  @ApiProperty({ example: 0 })
  displayOrder: number;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;
}

// ============================================
// NESTED RESPONSES
// ============================================

// Object with its fields
export class BlueprintObjectWithFieldsDto extends CrmTemplateBlueprintObjectResponseDto {
  @ApiProperty({ type: [CrmTemplateBlueprintFieldResponseDto] })
  fields: CrmTemplateBlueprintFieldResponseDto[];
}

// Module with full tree
export class ModuleFullResponseDto extends CrmTemplateModuleResponseDto {
  @ApiProperty({ type: [BlueprintObjectWithFieldsDto] })
  blueprintObjects: BlueprintObjectWithFieldsDto[];

  @ApiProperty({ type: [CrmTemplateBlueprintAssociationResponseDto] })
  blueprintAssociations: CrmTemplateBlueprintAssociationResponseDto[];
}

// ============================================
// SPECIAL RESPONSES
// ============================================

// Slug availability check
export class SlugAvailabilityResponseDto {
  @ApiProperty({ example: false })
  available: boolean;

  @ApiPropertyOptional({ example: 'crm-basic-2' })
  suggestion?: string;
}

// Installation status
export class InstalledModuleDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Sales' })
  name: string;

  @ApiProperty({ example: 'sales' })
  slug: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  installedAt: string;

  @ApiPropertyOptional({ example: '770e8400-e29b-41d4-a716-446655440000' })
  installedBy?: string;
}

export class AvailableModuleDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'Marketing' })
  name: string;

  @ApiProperty({ example: 'marketing' })
  slug: string;

  @ApiProperty({ example: false })
  isCore: boolean;

  @ApiPropertyOptional({ type: [String], example: ['sales'] })
  dependsOn?: string[];

  @ApiPropertyOptional({ type: [String], example: [] })
  conflictsWith?: string[];
}

export class InstallationStatusResponseDto {
  @ApiProperty({ example: true })
  isInstalled: boolean;

  @ApiPropertyOptional({ example: '2024-01-15T10:30:00.000Z' })
  installedAt?: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  templateId?: string;

  @ApiPropertyOptional({ example: 'CRM Basic' })
  templateName?: string;

  @ApiProperty({ type: [InstalledModuleDto] })
  installedModules: InstalledModuleDto[];

  @ApiProperty({ type: [AvailableModuleDto] })
  availableModules: AvailableModuleDto[];
}

// ============================================
// API WRAPPERS
// ============================================

export class PaginationMetaDto {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;
}

export class ErrorDetailDto {
  @ApiProperty({ example: 'VALIDATION_ERROR' })
  code: string;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiPropertyOptional({ example: { name: ['Name is required'] } })
  details?: Record<string, string[]>;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false })
  success: false;

  @ApiProperty({ type: ErrorDetailDto })
  error: ErrorDetailDto;
}
```

#### Controller Usage Example

```typescript
// templates.controller.ts

@ApiTags('CRM Templates')
@Controller('admin/templates')
export class CrmTemplatesController {
  
  @Get()
  @ApiOperation({ summary: 'List all templates' })
  @ApiOkResponse({ type: [CrmTemplateListItemDto] })
  findAll() { ... }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiOkResponse({ type: CrmTemplateResponseDto })
  @ApiNotFoundResponse({ type: ApiErrorResponseDto })
  findOne(@Param('id') id: string) { ... }

  @Get('slug/:slug/available')
  @ApiOperation({ summary: 'Check if slug is available' })
  @ApiOkResponse({ type: SlugAvailabilityResponseDto })
  checkSlugAvailability(@Param('slug') slug: string) { ... }

  @Post()
  @ApiOperation({ summary: 'Create new template' })
  @ApiCreatedResponse({ type: CrmTemplateResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  create(@Body() dto: CreateCrmTemplateDto) { ... }

  @Post('install')
  @ApiOperation({ summary: 'Install template to company' })
  @ApiCreatedResponse({ type: InstallationStatusResponseDto })
  @ApiBadRequestResponse({ type: ApiErrorResponseDto })
  installTemplate(@Body() dto: InstallTemplateDto) { ... }
}
```

---

### Error Codes

```typescript
// src/api/enums/templates/error-codes.enum.ts

export enum TemplateErrorCode {
  // Generic
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  
  // Template-specific
  SLUG_TAKEN = 'SLUG_TAKEN',
  SLUG_INVALID = 'SLUG_INVALID',
  TEMPLATE_IN_USE = 'TEMPLATE_IN_USE',
  
  // Installation
  ALREADY_INSTALLED = 'ALREADY_INSTALLED',
  NOT_INSTALLED = 'NOT_INSTALLED',
  MODULE_REQUIRED = 'MODULE_REQUIRED',
  MODULE_ALREADY_INSTALLED = 'MODULE_ALREADY_INSTALLED',
  
  // Blueprint validation
  CIRCULAR_ASSOCIATION = 'CIRCULAR_ASSOCIATION',
  FIELD_NAME_CONFLICT = 'FIELD_NAME_CONFLICT',
  OBJECT_NAME_CONFLICT = 'OBJECT_NAME_CONFLICT',
  MAX_FIELDS_EXCEEDED = 'MAX_FIELDS_EXCEEDED',
  INVALID_FIELD_TYPE = 'INVALID_FIELD_TYPE',
}
```

---

### File Structure (Your Architecture)

```
src/api/
│
├── entities/
│   └── templates/
│       ├── template.entity.ts
│       ├── template-module.entity.ts
│       ├── blueprint-object.entity.ts
│       ├── blueprint-field.entity.ts
│       ├── blueprint-association.entity.ts
│       └── index.ts
│
├── enums/
│   └── templates/
│       ├── field-type.enum.ts
│       ├── association-type.enum.ts
│       ├── error-codes.enum.ts
│       └── index.ts
│
├── repositories/
│   └── postgres/
│       └── templates/
│           ├── template.repository.ts
│           ├── template-module.repository.ts
│           ├── blueprint-object.repository.ts
│           ├── blueprint-field.repository.ts
│           ├── blueprint-association.repository.ts
│           └── index.ts
│
└── admin/
    └── templates/
        │
        ├── dto/
        │   ├── requests/
        │   │   ├── create-template.dto.ts
        │   │   ├── update-template.dto.ts
        │   │   ├── install-template.dto.ts
        │   │   └── index.ts
        │   ├── responses/
        │   │   ├── template-response.dto.ts
        │   │   ├── template-list-item.dto.ts
        │   │   ├── installation-status-response.dto.ts
        │   │   ├── slug-availability-response.dto.ts
        │   │   └── index.ts
        │   └── index.ts
        │
        ├── modules/
        │   ├── dto/
        │   │   ├── requests/
        │   │   │   ├── create-module.dto.ts
        │   │   │   ├── update-module.dto.ts
        │   │   │   ├── reorder-modules.dto.ts
        │   │   │   └── index.ts
        │   │   ├── responses/
        │   │   │   ├── module-response.dto.ts
        │   │   │   ├── module-full-response.dto.ts
        │   │   │   └── index.ts
        │   │   └── index.ts
        │   ├── modules.controller.ts
        │   ├── modules.service.ts
        │   └── modules.module.ts
        │
        ├── blueprint-objects/
        │   ├── dto/
        │   │   ├── requests/
        │   │   │   ├── create-blueprint-object.dto.ts
        │   │   │   ├── update-blueprint-object.dto.ts
        │   │   │   ├── reorder-objects.dto.ts
        │   │   │   └── index.ts
        │   │   ├── responses/
        │   │   │   ├── blueprint-object-response.dto.ts
        │   │   │   ├── blueprint-object-with-fields.dto.ts
        │   │   │   └── index.ts
        │   │   └── index.ts
        │   ├── blueprint-objects.controller.ts
        │   ├── blueprint-objects.service.ts
        │   └── blueprint-objects.module.ts
        │
        ├── blueprint-fields/
        │   ├── dto/
        │   │   ├── requests/
        │   │   │   ├── create-blueprint-field.dto.ts
        │   │   │   ├── update-blueprint-field.dto.ts
        │   │   │   ├── bulk-create-fields.dto.ts
        │   │   │   ├── reorder-fields.dto.ts
        │   │   │   └── index.ts
        │   │   ├── responses/
        │   │   │   ├── blueprint-field-response.dto.ts
        │   │   │   └── index.ts
        │   │   └── index.ts
        │   ├── blueprint-fields.controller.ts
        │   ├── blueprint-fields.service.ts
        │   └── blueprint-fields.module.ts
        │
        ├── blueprint-associations/
        │   ├── dto/
        │   │   ├── requests/
        │   │   │   ├── create-blueprint-association.dto.ts
        │   │   │   ├── update-blueprint-association.dto.ts
        │   │   │   └── index.ts
        │   │   ├── responses/
        │   │   │   ├── blueprint-association-response.dto.ts
        │   │   │   └── index.ts
        │   │   └── index.ts
        │   ├── blueprint-associations.controller.ts
        │   ├── blueprint-associations.service.ts
        │   └── blueprint-associations.module.ts
        │
        ├── templates.controller.ts
        ├── templates.service.ts
        └── templates.module.ts
```

---

### Import Paths

```typescript
// In a controller/service, imports look like:

// Entities (centralized)
import { Template } from '@/api/entities/templates';
import { TemplateModule } from '@/api/entities/templates';
import { BlueprintObject } from '@/api/entities/templates';

// Enums (centralized)
import { FieldType, AssociationType } from '@/api/enums/templates';
import { TemplateErrorCode } from '@/api/enums/templates';

// Repositories (centralized)
import { TemplateRepository } from '@/api/repositories/postgres/templates';

// DTOs (within feature module)
import { CreateTemplateDto } from './dto/requests';
import { TemplateResponseDto } from './dto/responses';

// DTOs from sub-feature
import { CreateModuleDto } from './modules/dto/requests';
import { ModuleFullResponseDto } from './modules/dto/responses';

// DTOs from sibling sub-feature
import { BlueprintObjectResponseDto } from '../blueprint-objects/dto/responses';
```

---

### Checklist

#### Centralized (src/api/entities, enums, repositories)

| Type | Path | Status |
|------|------|--------|
| Template entity | entities/templates/template.entity.ts | ⬜ |
| TemplateModule entity | entities/templates/template-module.entity.ts | ⬜ |
| BlueprintObject entity | entities/templates/blueprint-object.entity.ts | ⬜ |
| BlueprintField entity | entities/templates/blueprint-field.entity.ts | ⬜ |
| BlueprintAssociation entity | entities/templates/blueprint-association.entity.ts | ⬜ |
| FieldType enum | enums/templates/field-type.enum.ts | ⬜ |
| AssociationType enum | enums/templates/association-type.enum.ts | ⬜ |
| ErrorCode enum | enums/templates/error-codes.enum.ts | ⬜ |

#### Templates (src/api/admin/templates)

| Type | Path | Status |
|------|------|--------|
| CreateTemplateDto | dto/requests/create-template.dto.ts | ⬜ |
| UpdateTemplateDto | dto/requests/update-template.dto.ts | ⬜ |
| InstallTemplateDto | dto/requests/install-template.dto.ts | ⬜ |
| TemplateResponseDto | dto/responses/template-response.dto.ts | ⬜ |
| TemplateListItemDto | dto/responses/template-list-item.dto.ts | ⬜ |
| InstallationStatusResponseDto | dto/responses/installation-status-response.dto.ts | ⬜ |
| SlugAvailabilityResponseDto | dto/responses/slug-availability-response.dto.ts | ⬜ |

#### Modules (src/api/admin/templates/modules)

| Type | Path | Status |
|------|------|--------|
| CreateModuleDto | dto/requests/create-module.dto.ts | ⬜ |
| UpdateModuleDto | dto/requests/update-module.dto.ts | ⬜ |
| ReorderModulesDto | dto/requests/reorder-modules.dto.ts | ⬜ |
| ModuleResponseDto | dto/responses/module-response.dto.ts | ⬜ |
| ModuleFullResponseDto | dto/responses/module-full-response.dto.ts | ⬜ |

#### Blueprint Objects (src/api/admin/templates/blueprint-objects)

| Type | Path | Status |
|------|------|--------|
| CreateBlueprintObjectDto | dto/requests/create-blueprint-object.dto.ts | ⬜ |
| UpdateBlueprintObjectDto | dto/requests/update-blueprint-object.dto.ts | ⬜ |
| ReorderObjectsDto | dto/requests/reorder-objects.dto.ts | ⬜ |
| BlueprintObjectResponseDto | dto/responses/blueprint-object-response.dto.ts | ⬜ |
| BlueprintObjectWithFieldsDto | dto/responses/blueprint-object-with-fields.dto.ts | ⬜ |

#### Blueprint Fields (src/api/admin/templates/blueprint-fields)

| Type | Path | Status |
|------|------|--------|
| CreateBlueprintFieldDto | dto/requests/create-blueprint-field.dto.ts | ⬜ |
| UpdateBlueprintFieldDto | dto/requests/update-blueprint-field.dto.ts | ⬜ |
| BulkCreateFieldsDto | dto/requests/bulk-create-fields.dto.ts | ⬜ |
| ReorderFieldsDto | dto/requests/reorder-fields.dto.ts | ⬜ |
| BlueprintFieldResponseDto | dto/responses/blueprint-field-response.dto.ts | ⬜ |

#### Blueprint Associations (src/api/admin/templates/blueprint-associations)

| Type | Path | Status |
|------|------|--------|
| CreateBlueprintAssociationDto | dto/requests/create-blueprint-association.dto.ts | ⬜ |
| UpdateBlueprintAssociationDto | dto/requests/update-blueprint-association.dto.ts | ⬜ |
| BlueprintAssociationResponseDto | dto/responses/blueprint-association-response.dto.ts | ⬜ |

---

## 1.5 Edge Cases & Questions

| Question / Edge Case | Answer / Decision |
|---------------------|-------------------|
| Can template be deleted if installed? | No, returns TEMPLATE_IN_USE |
| Can required module be uninstalled? | No, returns MODULE_REQUIRED |
| Slug changed after install? | Slug is immutable after first install |
| Max modules per template? | 50 |
| Max objects per module? | 100 |
| Max fields per object? | 200 |
| Partial install failure? | Full transaction rollback |
| Can objects move between modules? | No, delete and recreate |
| Field name uniqueness? | Unique within object only |

---

# PHASE 2: Architecture & Backend

## 2.1 Architecture Review

### Decisions Made

1. **Soft delete for templates** — isActive=false, not hard delete
2. **Reordering** — Accept ID array, batch update sortOrder in transaction
3. **Slug validation** — Check at create AND before save
4. **Installation** — Atomic transaction, rollback on any failure
5. **Cascades** — DB-level ON DELETE CASCADE for children

---

## 2.2 Database Changes

| Table | Change Type | Migration Name | Status |
|-------|-------------|----------------|--------|
| templates | CREATE | 001_create_templates | ✅ |
| template_modules | CREATE | 002_create_modules | ✅ |
| blueprint_objects | CREATE | 003_create_objects | ✅ |
| blueprint_fields | CREATE | 004_create_fields | ✅ |
| blueprint_associations | CREATE | 005_create_associations | ✅ |
| company_template_installs | CREATE | 006_create_installs | ✅ |

---

## 2.3 Implementation & Testing Tracker

### 🟢 Group 1: CREATE Chain

| Order | Endpoint | Impl | Tested | Notes |
|-------|----------|------|--------|-------|
| 1 | `GET /slug/{slug}/available` | ✅ | ✅ | Returns suggestion if taken |
| 2 | `POST /templates` | ✅ | ✅ | |
| 3 | `POST /modules` | ✅ | ✅ | |
| 4 | `POST /blueprint-objects` | ✅ | ✅ | |
| 5 | `POST /blueprint-fields` | ✅ | ✅ | |
| 6 | `POST /blueprint-fields/bulk` | ✅ | ✅ | Max 50 at once |
| 7 | `POST /blueprint-associations` | ✅ | ✅ | Checks for circular |
| 8 | `POST /install` | ✅ | 🟡 | Need more edge cases |
| 9 | `GET /company/{companyId}` | ✅ | ✅ | |

#### Group 1 Flow Test (Scalar)

| Step | Action | Expected | Actual | Pass? |
|------|--------|----------|--------|-------|
| 1 | Check slug "crm-basic" | { available: true } | { available: true } | ✅ |
| 2 | Create template | 201 + id | 201 + tpl_abc | ✅ |
| 3 | Create module "Sales" | 201 + id | 201 + mod_def | ✅ |
| 4 | Create object "Deal" | 201 + id | 201 + obj_ghi | ✅ |
| 5 | Bulk create 3 fields | 201 + 3 fields | 201 + 3 fields | ✅ |
| 6 | Create object "Contact" | 201 + id | 201 + obj_jkl | ✅ |
| 7 | Create association | 201 | 201 | ✅ |
| 8 | Install to company_123 | 201 | 201 | ✅ |
| 9 | Check status | isInstalled: true | isInstalled: true | ✅ |

#### Group 1 Edge Cases

| Test Case | Expected | Pass? |
|-----------|----------|-------|
| Missing auth | 401 | ✅ |
| Non-admin user | 403 | ✅ |
| Invalid templateId on module | 404 | ✅ |
| Duplicate slug | 400 SLUG_TAKEN | ✅ |
| Install already installed | 400 ALREADY_INSTALLED | ✅ |
| Circular association | 400 CIRCULAR_ASSOCIATION | ✅ |

**✅ Group 1 Complete?** [x] Yes — Can start frontend CREATE flow

---

### 🔵 Group 2: READ Operations

| Endpoint | Impl | Tested | Notes |
|----------|------|--------|-------|
| `GET /templates` | ✅ | ✅ | Has pagination |
| `GET /templates/{id}` | ✅ | ✅ | |
| `GET /templates/slug/{slug}` | ✅ | ✅ | |
| `GET /modules` | ✅ | ✅ | Filter by templateId |
| `GET /modules/{id}` | ✅ | ✅ | |
| `GET /modules/{id}/full` | ✅ | ✅ | Returns complete tree |
| `GET /blueprint-objects` | ✅ | ⬜ | |
| `GET /blueprint-objects/{id}` | ✅ | ⬜ | |
| `GET /blueprint-objects/{id}/with-fields` | ✅ | ⬜ | |
| `GET /blueprint-fields` | ✅ | ⬜ | |
| `GET /blueprint-fields/{id}` | ⬜ | ⬜ | Low priority |
| `GET /blueprint-associations` | ✅ | ⬜ | |
| `GET /blueprint-associations/{id}` | ⬜ | ⬜ | Low priority |

#### Group 2 Tests

| Test Case | Expected | Pass? |
|-----------|----------|-------|
| List returns created templates | Visible | ✅ |
| Get template by ID | Correct data | ✅ |
| Get non-existent ID | 404 | ✅ |
| Get module/full | Complete tree | ✅ |
| Pagination works | Correct pages | ✅ |
| Filter modules by templateId | Only those modules | ✅ |

**✅ Group 2 Complete?** [ ] In progress

---

### 🟡 Group 3: UPDATE Operations

| Endpoint | Impl | Tested | Notes |
|----------|------|--------|-------|
| `PATCH /templates/{id}` | ⬜ | ⬜ | |
| `PATCH /modules/{id}` | ⬜ | ⬜ | |
| `PATCH /blueprint-objects/{id}` | ⬜ | ⬜ | |
| `PATCH /blueprint-fields/{id}` | ⬜ | ⬜ | |
| `PATCH /blueprint-associations/{id}` | ⬜ | ⬜ | |

**✅ Group 3 Complete?** [ ] Not started

---

### 🔴 Group 4: DELETE Operations

| Order | Endpoint | Impl | Tested | Cascade | Notes |
|-------|----------|------|--------|---------|-------|
| 1 | `DELETE /blueprint-fields/{id}` | ⬜ | ⬜ | None | |
| 2 | `DELETE /blueprint-associations/{id}` | ⬜ | ⬜ | None | |
| 3 | `DELETE /blueprint-objects/{id}` | ⬜ | ⬜ | → fields | |
| 4 | `DELETE /modules/{id}` | ⬜ | ⬜ | → objects → fields | |
| 5 | `DELETE /templates/{id}` | ⬜ | ⬜ | BLOCKED if installed | |

**✅ Group 4 Complete?** [ ] Not started

---

### ⚪ Group 5: Utilities

| Endpoint | Impl | Tested | Notes |
|----------|------|--------|-------|
| `POST /modules/{templateId}/reorder` | ⬜ | ⬜ | |
| `POST /blueprint-objects/{moduleId}/reorder` | ⬜ | ⬜ | |
| `POST /blueprint-fields/{objectId}/reorder` | ⬜ | ⬜ | |
| `POST /install-module` | ⬜ | ⬜ | |
| `POST /uninstall-module` | ⬜ | ⬜ | |

**✅ Group 5 Complete?** [ ] Not started

---

## 2.4 Response Shape Validation

| Endpoint | Fields Match? | Casing Correct? | Dates Format? | Pass? |
|----------|---------------|-----------------|---------------|-------|
| POST /templates | ✅ | ✅ | ✅ | ✅ |
| GET /templates | ✅ | ✅ | ✅ | ✅ |
| GET /modules/{id}/full | ✅ | ✅ | ✅ | ✅ |
| POST /install | ✅ | ✅ | ✅ | ✅ |

---

# PHASE 3: Frontend Build

> **Current status:** Group 1 complete → Can build create wizard
> 
> **Parallel work:** Building create wizard while completing Group 2

## 3.1 Component Breakdown

| Component | Type | Depends on Group | Status |
|-----------|------|------------------|--------|
| TemplateWizard | Page | Group 1 | 🟡 In progress |
| TemplateList | Page | Group 2 | ⬜ |
| TemplateEditor | Page | Groups 2, 3 | ⬜ |
| ModuleCard | UI | Group 2 | ⬜ |
| ObjectEditor | Container | Groups 1, 2, 3 | ⬜ |
| FieldEditor | Container | Groups 1, 2, 3 | ⬜ |
| InstallModal | UI | Group 1 | ✅ |

---

# Notes & Decisions Log

| Date | Decision | Reasoning |
|------|----------|-----------|
| 2024-01-15 | Use vertical slice approach | Can test real flows early |
| 2024-01-15 | Soft delete for templates | Audit trail, recovery |
| 2024-01-16 | Slug immutable after install | Would break references |
| 2024-01-17 | Bulk field create max 50 | Prevent timeout |
| 2024-01-18 | Start frontend after Group 1 | Don't wait for everything |
