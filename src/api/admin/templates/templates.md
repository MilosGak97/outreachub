/
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
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TEMPLATE MANAGEMENT SYSTEM                          │
│                                                                             │
│  Template (e.g., "Movers CRM")                                              │
│    └── Modules (e.g., "Core", "Inventory", "Scheduling")                    │
│          ├── Blueprint Objects (e.g., "Contact", "Job", "Invoice")          │
│          │     └── Blueprint Fields (e.g., "email", "phone", "status")      │
│          └── Blueprint Associations (e.g., "Contact → Jobs")                │
└─────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
FLOW 1: CREATE NEW TEMPLATE
═══════════════════════════════════════════════════════════════════════════════

[Admin Dashboard]
       │
       ▼
[GET /admin/templates/slug/:slug/available] ──→ { available: false } ──→ [Choose different slug]
       │
       │ { available: true }
       ▼
[POST /admin/templates] ──→ { id: "template-uuid" }
       │
       │ Template created (isActive: false by default)
       ▼
[POST /admin/templates/modules] ──→ { id: "module-uuid" }
       │
       │ Create module (e.g., "Core" with isCore: true)
       ▼
[POST /admin/templates/blueprint-objects] ──→ { id: "object-uuid" }
       │
       │ Create object (e.g., "Contact" with apiName: "_contact")
       ▼
[POST /admin/templates/blueprint-fields/bulk] ──→ { ids: ["field-1", "field-2", ...] }
       │
       │ Bulk create fields (e.g., email, phone, firstName, lastName)
       ▼
[POST /admin/templates/blueprint-associations] ──→ { id: "assoc-uuid" }
       │
       │ Create association (e.g., Contact → Jobs, one-to-many)
       ▼
[PATCH /admin/templates/:id] { isActive: true }
       │
       │ Activate template when ready for installation
       ▼
[Template Ready for Companies]

═══════════════════════════════════════════════════════════════════════════════
FLOW 2: INSTALL TEMPLATE TO COMPANY
═══════════════════════════════════════════════════════════════════════════════

[Select Company for Installation]
       │
       ▼
[GET /admin/templates/company/:companyId]
       │
       ├──→ { template: {...}, modules: [...] } ──→ [Already has template - show status]
       │
       │ { template: null, modules: [] }
       ▼
[POST /admin/templates/install]
  body: {
    companyId: "company-uuid",
    templateSlug: "movers_crm",
    modules: ["core", "inventory"]  // or installAllModules: true
  }
       │
       ▼
[Installation Process]
  1. Validate company doesn't have template
  2. For each selected module:
     - Create CRM object types from blueprints
     - Create fields from blueprint fields
     - Create associations from blueprint associations
  3. Mark entities with templateOriginId
  4. Apply protection levels
       │
       ▼
[Response: InstallationResultDto]
  {
    success: true,
    templateSlug: "movers_crm",
    installedModules: ["core", "inventory"],
    createdObjectTypes: 5,
    createdFields: 42,
    createdAssociations: 8
  }

═══════════════════════════════════════════════════════════════════════════════
FLOW 3: ADD/REMOVE MODULES POST-INSTALLATION
═══════════════════════════════════════════════════════════════════════════════

[Company Already Has Template Installed]
       │
       ├──────────────────────────────────────────┐
       │                                          │
       ▼                                          ▼
[POST /admin/templates/install-module]    [POST /admin/templates/uninstall-module]
  body: {                                   body: {
    companyId: "...",                         companyId: "...",
    moduleSlug: "scheduling"                  moduleSlug: "reporting",
  }                                           force: false  // or true
       │                                      }
       │                                          │
       ▼                                          ▼
[Adds module entities]                    [Checks for existing data]
                                                  │
                                          ┌───────┴───────┐
                                          │               │
                                          ▼               ▼
                                    [Has data]      [No data]
                                    force=false     or force=true
                                          │               │
                                          ▼               ▼
                                    [Error: data     [Deletes module
                                     exists]          entities]

═══════════════════════════════════════════════════════════════════════════════
FLOW 4: TEMPLATE BUILDER (CRUD OPERATIONS)
═══════════════════════════════════════════════════════════════════════════════

┌─ TEMPLATES (/admin/templates) ────────────────────────────────────────────┐
│  GET    /                         List all templates (paginated)          │
│  POST   /                         Create new template                     │
│  GET    /:id                      Get template by UUID                    │
│  GET    /slug/:slug               Get template by slug                    │
│  GET    /slug/:slug/available     Check slug availability                 │
│  PATCH  /:id                      Update template (name, desc, isActive)  │
│  DELETE /:id                      Delete template (blocked if installed)  │
└───────────────────────────────────────────────────────────────────────────┘

┌─ MODULES (/admin/templates/modules) ──────────────────────────────────────┐
│  GET    /                         List modules (filter by templateId)     │
│  POST   /                         Create module in template               │
│  GET    /:id                      Get module by ID                        │
│  GET    /:id/full                 Get module with objects/fields/assocs   │
│  PATCH  /:id                      Update module                           │
│  DELETE /:id                      Delete module (blocked if installed)    │
│  POST   /:templateId/reorder      Reorder modules in template             │
└───────────────────────────────────────────────────────────────────────────┘

┌─ BLUEPRINT OBJECTS (/admin/templates/blueprint-objects) ──────────────────┐
│  GET    /                         List objects (filter by moduleId)       │
│  POST   /                         Create object in module                 │
│  GET    /:id                      Get object by ID                        │
│  GET    /:id/with-fields          Get object with all fields              │
│  PATCH  /:id                      Update object                           │
│  DELETE /:id                      Delete object (cascades fields)         │
│  POST   /:moduleId/reorder        Reorder objects in module               │
└───────────────────────────────────────────────────────────────────────────┘

┌─ BLUEPRINT FIELDS (/admin/templates/blueprint-fields) ────────────────────┐
│  GET    /                         List fields (filter by objectId)        │
│  POST   /                         Create field in object                  │
│  POST   /bulk                     Bulk create multiple fields             │
│  GET    /:id                      Get field by ID                         │
│  PATCH  /:id                      Update field                            │
│  DELETE /:id                      Delete field                            │
│  POST   /:objectId/reorder        Reorder fields in object                │
└───────────────────────────────────────────────────────────────────────────┘

┌─ BLUEPRINT ASSOCIATIONS (/admin/templates/blueprint-associations) ────────┐
│  GET    /                         List associations (filter by moduleId)  │
│  POST   /                         Create association between objects      │
│  GET    /:id                      Get association by ID                   │
│  PATCH  /:id                      Update association                      │
│  DELETE /:id                      Delete association                      │
└───────────────────────────────────────────────────────────────────────────┘

┌─ INSTALLATION (/admin/templates) ─────────────────────────────────────────┐
│  POST   /install                  Install template to company             │
│  POST   /install-module           Add module to existing installation     │
│  POST   /uninstall-module         Remove module from company              │
│  GET    /company/:companyId       Get company's installation status       │
└───────────────────────────────────────────────────────────────────────────┘
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

> All request DTOs live under `src/api/admin/templates/*/dto` and are decorated with `class-validator` plus `@ApiProperty*` helpers for Swagger.
>
> **Note:** Imports omitted for readability.

```typescript
// ============================================
// dto/requests/create-template.dto.ts
// ============================================

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[a-z0-9_-]+$/)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// dto/requests/update-template.dto.ts
// ============================================

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// dto/requests/get-templates-query.dto.ts
// ============================================

export class GetTemplatesQueryDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @Transform(({ value }) => value === 'true' ? true : value === 'false' ? false : value)
  @IsBoolean()
  isActive?: boolean;
}

// ============================================
// dto/requests/install-template.dto.ts
// ============================================

export class InstallTemplateDto {
  @IsUUID('4')
  companyId: string;

  @IsString()
  @IsNotEmpty()
  templateSlug: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  modules?: string[];

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  installAllModules?: boolean;
}

// ============================================
// dto/requests/install-module.dto.ts
// ============================================

export class InstallModuleDto {
  @IsUUID('4')
  companyId: string;

  @IsString()
  @IsNotEmpty()
  moduleSlug: string;
}

// ============================================
// dto/requests/uninstall-module.dto.ts
// ============================================

export class UninstallModuleDto {
  @IsUUID('4')
  companyId: string;

  @IsString()
  @IsNotEmpty()
  moduleSlug: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  force?: boolean;
}

// ============================================
// modules/dto/requests/create-template-module.dto.ts
// ============================================

export class CreateTemplateModuleDto {
  @IsUUID()
  templateId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[a-z0-9_-]+$/)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isCore?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependsOn?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conflictsWith?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// modules/dto/requests/update-template-module.dto.ts
// ============================================

export class UpdateTemplateModuleDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isCore?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dependsOn?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  conflictsWith?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// modules/dto/requests/get-modules-query.dto.ts
// ============================================

export class GetModulesQueryDto {
  @IsUUID()
  templateId: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  offset: number;
}

// ============================================
// modules/dto/requests/reorder-template-modules.dto.ts
// ============================================

export class ReorderTemplateModulesDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  orderedIds?: string[];
}

// ============================================
// blueprint-objects/dto/requests/create-blueprint-object.dto.ts
// ============================================

export class CreateBlueprintObjectDto {
  @IsUUID()
  moduleId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  apiName: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TemplateItemProtection)
  protection?: TemplateItemProtection;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// blueprint-objects/dto/requests/update-blueprint-object.dto.ts
// ============================================

export class UpdateBlueprintObjectDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TemplateItemProtection)
  protection?: TemplateItemProtection;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// blueprint-objects/dto/requests/get-blueprint-objects-query.dto.ts
// ============================================

export class GetBlueprintObjectsQueryDto {
  @IsUUID()
  moduleId: string;
}

// ============================================
// blueprint-fields/dto/create-blueprint-field.dto.ts
// ============================================

export class CreateBlueprintFieldDto {
  @IsUUID()
  blueprintObjectId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  apiName: string;

  @IsEnum(FieldType)
  fieldType: FieldType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsObject()
  shape?: Record<string, any>;

  @IsOptional()
  @IsObject()
  configShape?: Record<string, any>;

  @IsOptional()
  @IsEnum(TemplateItemProtection)
  protection?: TemplateItemProtection;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// blueprint-fields/dto/update-blueprint-field.dto.ts
// ============================================

export class UpdateBlueprintFieldDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  apiName?: string;

  @IsOptional()
  @IsEnum(FieldType)
  fieldType?: FieldType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @IsOptional()
  @IsObject()
  shape?: Record<string, any>;

  @IsOptional()
  @IsObject()
  configShape?: Record<string, any>;

  @IsOptional()
  @IsEnum(TemplateItemProtection)
  protection?: TemplateItemProtection;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// blueprint-fields/dto/get-blueprint-fields-query.dto.ts
// ============================================

export class GetBlueprintFieldsQueryDto {
  @IsUUID()
  blueprintObjectId: string;
}

// ============================================
// blueprint-fields/dto/bulk-create-blueprint-fields.dto.ts
// ============================================

export class BulkCreateBlueprintFieldsDto {
  @IsUUID()
  blueprintObjectId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBlueprintFieldDto)
  fields: CreateBlueprintFieldDto[];
}

// ============================================
// blueprint-associations/dto/create-blueprint-association.dto.ts
// ============================================

export class CreateBlueprintAssociationDto {
  @IsUUID()
  moduleId: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  apiName: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  sourceObjectApiName: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  targetObjectApiName: string;

  @IsEnum(AssociationCardinality)
  sourceCardinality: AssociationCardinality;

  @IsEnum(AssociationCardinality)
  targetCardinality: AssociationCardinality;

  @IsOptional()
  @IsBoolean()
  isBidirectional?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  reverseName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TemplateItemProtection)
  protection?: TemplateItemProtection;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// blueprint-associations/dto/update-blueprint-association.dto.ts
// ============================================

export class UpdateBlueprintAssociationDto {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  apiName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  sourceObjectApiName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  targetObjectApiName?: string;

  @IsOptional()
  @IsEnum(AssociationCardinality)
  sourceCardinality?: AssociationCardinality;

  @IsOptional()
  @IsEnum(AssociationCardinality)
  targetCardinality?: AssociationCardinality;

  @IsOptional()
  @IsBoolean()
  isBidirectional?: boolean;

  @IsOptional()
  @IsString()
  @Length(1, 255)
  reverseName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(TemplateItemProtection)
  protection?: TemplateItemProtection;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}

// ============================================
// blueprint-associations/dto/get-blueprint-associations-query.dto.ts
// ============================================

export class GetBlueprintAssociationsQueryDto {
  @IsUUID()
  moduleId: string;
}
```

### Response DTOs (Swagger/OpenAPI)

> Response DTOs describe the payloads returned via `@ApiOkResponse` (e.g. `TemplateListResponseDto` or `ModuleResponseDto`). They live alongside each feature's `dto/` folder.
>
> **Note:** Imports omitted for readability.

```typescript
// ============================================
// dto/template-response.dto.ts
// ============================================

export class TemplateResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ nullable: true })
  icon: string | null;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  modulesCount: number;

  @ApiProperty()
  companiesCount: number;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt: Date;
}

// ============================================
// dto/template-list-response.dto.ts
// ============================================

export class TemplateListResponseDto {
  @ApiProperty({ type: [TemplateResponseDto] })
  result: TemplateResponseDto[];

  @ApiProperty()
  totalRecords: number;

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}

// ============================================
// dto/installation-result.dto.ts
// ============================================

export class InstallationResultDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  templateSlug: string;

  @ApiProperty({ type: [String] })
  installedModules: string[];

  @ApiProperty()
  createdObjectTypes: number;

  @ApiProperty()
  createdFields: number;

  @ApiProperty()
  createdAssociations: number;

  @ApiPropertyOptional({ type: [String] })
  errors?: string[];
}

// ============================================
// dto/company-template-installation-response.dto.ts
// ============================================

class InstalledTemplateDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiPropertyOptional({ nullable: true })
  icon: string | null;
}

class InstalledModuleDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional({ nullable: true })
  description: string | null;

  @ApiProperty()
  isCore: boolean;

  @ApiProperty()
  displayOrder: number;
}

export class CompanyTemplateInstallationResponseDto {
  @ApiPropertyOptional({ type: InstalledTemplateDto, nullable: true })
  template: InstalledTemplateDto | null;

  @ApiProperty({ type: [InstalledModuleDto] })
  modules: InstalledModuleDto[];
}

// ============================================
// dto/uninstall-module-response.dto.ts
// ============================================

export class UninstallModuleResponseDto {
  @ApiProperty()
  message: string;

  @ApiProperty()
  deletedCount: number;
}

// ============================================
// modules/dto/module-response.dto.ts
// ============================================

export class ModuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  templateId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  isCore: boolean;

  @ApiProperty({ type: [String] })
  dependsOn: string[];

  @ApiProperty({ type: [String] })
  conflictsWith: string[];

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  objectsCount: number;

  @ApiProperty()
  associationsCount: number;

  @ApiProperty()
  companiesInstalled: number;

  @ApiProperty()
  createdAt: Date;
}

// ============================================
// modules/dto/module-list-response.dto.ts
// ============================================

export class ModuleListResponseDto {
  @ApiProperty({ type: [ModuleResponseDto] })
  result: ModuleResponseDto[];

  @ApiProperty()
  totalRecords: number;

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}

// ============================================
// blueprint-objects/dto/blueprint-object-response.dto.ts
// ============================================

export class BlueprintObjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  apiName: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: TemplateItemProtection, enumName: TemplateItemProtectionEnumName })
  protection: TemplateItemProtection;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  fieldsCount: number;

  @ApiProperty()
  createdAt: Date;
}

// ============================================
// blueprint-fields/dto/blueprint-field-response.dto.ts
// ============================================

export class BlueprintFieldResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  blueprintObjectId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  apiName: string;

  @ApiProperty({ enum: FieldType, enumName: 'FieldType' })
  fieldType: FieldType;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  isRequired: boolean;

  @ApiPropertyOptional({ type: 'object' })
  shape?: Record<string, any>;

  @ApiPropertyOptional({ type: 'object' })
  configShape?: Record<string, any>;

  @ApiProperty({ enum: TemplateItemProtection, enumName: TemplateItemProtectionEnumName })
  protection: TemplateItemProtection;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  createdAt: Date;
}

// ============================================
// blueprint-associations/dto/blueprint-association-response.dto.ts
// ============================================

export class BlueprintAssociationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  apiName: string;

  @ApiProperty()
  sourceObjectApiName: string;

  @ApiProperty()
  targetObjectApiName: string;

  @ApiProperty({ enum: AssociationCardinality, enumName: 'AssociationCardinality' })
  sourceCardinality: AssociationCardinality;

  @ApiProperty({ enum: AssociationCardinality, enumName: 'AssociationCardinality' })
  targetCardinality: AssociationCardinality;

  @ApiProperty()
  isBidirectional: boolean;

  @ApiProperty({ nullable: true })
  reverseName: string | null;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ enum: TemplateItemProtection, enumName: TemplateItemProtectionEnumName })
  protection: TemplateItemProtection;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  createdAt: Date;
}
```

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
