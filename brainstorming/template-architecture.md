# CRM Template System - Architecture Brainstorming

## Vision

Build a modular, flexible CRM where customers can:
- Choose an industry template (Movers, Realtors, etc.)
- Select which feature modules they need
- Have core objects auto-created with appropriate protection levels
- Add their own custom objects/fields on top

---

## Core Principle: Blueprints vs Reality

```
+------------------------------------------------------------------------+
|                        BLUEPRINT LAYER                                  |
|              (Templates - Define what SHOULD exist)                     |
|                                                                         |
|   +-----------+      +-----------+      +-------------+                |
|   | Template  |----->|  Module   |----->|  Blueprint  |                |
|   | "Movers"  |      |"Local Mv" |      |  Objects,   |                |
|   |           |      |           |      |  Fields,    |                |
|   |           |      |           |      |  Assocs     |                |
|   +-----------+      +-----------+      +-------------+                |
+------------------------------------------------------------------------+
                              |
                              | INSTALL (copies blueprints -> real entities)
                              v
+------------------------------------------------------------------------+
|                        REALITY LAYER                                    |
|           (Existing entities - per company)                             |
|                                                                         |
|   +--------------+   +---------------+   +--------------+              |
|   |CrmObjectType |   |CrmObjectField |   |CrmAssocType  |              |
|   | + originId   |   | + originId    |   | + originId   |              |
|   | + protection |   | + protection  |   | + protection |              |
|   +--------------+   +---------------+   +--------------+              |
|                                                                         |
|   These are EXISTING entities, just with 2 new optional columns        |
+------------------------------------------------------------------------+
```

**Key insight**: Templates don't replace our existing CRM entities. They're just blueprints that get "stamped" into real `CrmObjectType`, `CrmObjectField`, and `CrmAssociationType` records during installation.

---

## New Entities (Blueprint Layer)

### 1. `CrmTemplate` (Industry level)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `name` | string | "Movers CRM", "Realtors CRM" |
| `slug` | string | "movers", "realtors" - unique identifier |
| `description` | text | What this template is for |
| `icon` | string | Optional icon name/URL |
| `isActive` | boolean | Can users choose this template? |
| `displayOrder` | int | Sort order in selection UI |

**Example rows:**
```
| name         | slug     | description                    | isActive |
|--------------|----------|--------------------------------|----------|
| Movers CRM   | movers   | Complete CRM for moving cos    | true     |
| Realtors CRM | realtors | CRM for real estate agents     | true     |
| Logistics    | logistics| Supply chain & delivery mgmt   | false    |
```

---

### 2. `CrmTemplateModule` (Feature grouping)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `templateId` | UUID | FK -> CrmTemplate |
| `name` | string | "Local Moving", "Long Distance" |
| `slug` | string | "local_moving" - unique within template |
| `description` | text | What this module adds |
| `isCore` | boolean | **true = always installed, can't remove** |
| `dependsOn` | string[] | Module slugs this requires (e.g., ["local_moving"]) |
| `conflictsWith` | string[] | Module slugs that can't coexist |
| `displayOrder` | int | Sort order in selection UI |

**Key behaviors:**
- `isCore: true` modules are auto-installed and cannot be removed
- `dependsOn` prevents installing a module without its dependencies
- `conflictsWith` prevents incompatible combinations

**Example for Movers template:**
```
| name             | slug           | isCore | dependsOn        |
|------------------|----------------|--------|------------------|
| Core             | core           | true   | []               |
| Local Moving     | local_moving   | false  | []               |
| Long Distance    | long_distance  | false  | []               |
| Realtor Collab   | realtor_collab | false  | []               |
| Storage Services | storage        | false  | ["local_moving"] |
```

---

### 3. `CrmTemplateBlueprintObject` (What objects to create)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `moduleId` | UUID | FK -> CrmTemplateModule |
| `name` | string | "Local Move", "Contact" |
| `apiName` | string | "local_move" - used to link associations |
| `description` | text | Optional description |
| `protection` | enum | "full" / "delete_protected" / "none" |
| `displayOrder` | int | For consistent ordering |

**Protection levels explained:**

| Level | Can Delete? | Can Modify? | Use Case |
|-------|-------------|-------------|----------|
| `full` | No | No | Core system objects that must exist exactly as defined |
| `delete_protected` | No | Yes (add fields, etc.) | Must exist but user can customize |
| `none` | Yes | Yes | Optional - user can remove entirely |

---

### 4. `CrmTemplateBlueprintField` (What fields to create)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `blueprintObjectId` | UUID | FK -> CrmTemplateBlueprintObject |
| `name` | string | "Move Date", "First Name" |
| `apiName` | string | "move_date", "first_name" |
| `fieldType` | enum | Existing FieldType enum |
| `description` | text | Optional |
| `isRequired` | boolean | Field required? |
| `shape` | jsonb | Same as existing - value structure |
| `configShape` | jsonb | Same as existing - e.g., SELECT options |
| `protection` | enum | "full" / "delete_protected" / "none" |
| `displayOrder` | int | For field ordering |

---

### 5. `CrmTemplateBlueprintAssociation` (What associations to create)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `moduleId` | UUID | FK -> CrmTemplateModule |
| `name` | string | "Move to Lead" |
| `apiName` | string | "move_to_lead" |
| `sourceObjectApiName` | string | "local_move" - references blueprint object |
| `targetObjectApiName` | string | "lead" - can be from different module |
| `sourceCardinality` | enum | ONE / MANY |
| `targetCardinality` | enum | ONE / MANY |
| `isBidirectional` | boolean | Two-way relationship? |
| `reverseName` | string | Optional reverse label |
| `protection` | enum | "full" / "delete_protected" / "none" |

**Note**: `sourceObjectApiName` and `targetObjectApiName` reference blueprint objects by their `apiName`. During installation, these get resolved to real `CrmObjectType` UUIDs.

---

## Changes to Existing Entities

Minimal additions to track template origin:

### `CrmObjectType` - add:

| New Column | Type | Purpose |
|------------|------|---------|
| `templateOriginId` | UUID nullable | Which blueprint created this (null = custom) |
| `protection` | enum nullable | "full" / "delete_protected" / "none" / null |

### `CrmObjectField` - add:

| New Column | Type | Purpose |
|------------|------|---------|
| `templateOriginId` | UUID nullable | Which blueprint field created this |
| `protection` | enum nullable | Protection level |

### `CrmAssociationType` - add:

| New Column | Type | Purpose |
|------------|------|---------|
| `templateOriginId` | UUID nullable | Which blueprint association created this |
| `protection` | enum nullable | Protection level |

**Backward compatibility**: Existing data has `templateOriginId = null` and `protection = null`, meaning they're custom/unprotected. No migration issues.

---

## Tracking What's Installed (Per Company)

### `CompanyTemplate` (What template a company chose)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `companyId` | UUID | FK -> Company |
| `templateId` | UUID | FK -> CrmTemplate |
| `installedAt` | timestamp | When template was installed |

**Constraint**: One template per company (or allow switching?)

### `CompanyInstalledModule` (Which modules are active)

| Column | Type | Purpose |
|--------|------|---------|
| `id` | UUID | Primary key |
| `companyId` | UUID | FK -> Company |
| `moduleId` | UUID | FK -> CrmTemplateModule |
| `installedAt` | timestamp | When module was installed |

---

## User Flows

### Flow 1: Registration with Template

```
+----------------------------------+
|  Step 1: Basic Info              |
|  +----------------------------+  |
|  | Company Name: [__________] |  |
|  | Email:        [__________] |  |
|  | Password:     [__________] |  |
|  +----------------------------+  |
|                                  |
|  [Next ->]                       |
+----------------------------------+
                |
                v
+----------------------------------+
|  Step 2: Choose Industry         |
|                                  |
|  +-------+  +-------+  +-------+ |
|  |  Truck|  | House |  |  Box  | |
|  | Movers|  |Realtor|  | Logis | |
|  |   o   |  |   o   |  |   o   | |
|  +-------+  +-------+  +-------+ |
|                                  |
|  (fetches GET /templates)        |
|  [Select]                        |
+----------------------------------+
                |
                v
+----------------------------------+
|  Step 3: Customize Your CRM      |
|                                  |
|  [x] Core (always included)      |
|      Contact, Company, Lead      |
|                                  |
|  [ ] Local Moving                |
|      Track local/residential     |
|                                  |
|  [ ] Long Distance Moving        |
|      Interstate moves, DOT       |
|                                  |
|  [ ] Realtor Collaboration       |
|      Partner referrals           |
|                                  |
|  [ ] Storage Services            |
|      (requires Local Moving)     |  <- disabled until Local selected
|                                  |
|  [Complete Setup]                |
+----------------------------------+
                |
                v
        INSTALLATION HAPPENS
        (see Installation Flow)
```

---

### Flow 2: Installation Process

```
Backend receives:
{
  templateSlug: "movers",
  modules: ["local_moving", "realtor_collab"]
}

STEP 1: Load template
        +-- Fetch CrmTemplate by slug
        +-- Fetch all CrmTemplateModules for template
        +-- Automatically include isCore=true modules

STEP 2: Validate
        +-- Check dependsOn satisfied
        |   (storage needs local_moving - is it selected?)
        +-- Check conflictsWith not violated
        +-- Reject if validation fails

STEP 3: Build installation order
        +-- Core modules first
        +-- Then selected modules in dependency order
        +-- Within each module: objects first, then associations

STEP 4: For each module -> for each BlueprintObject:
        |
        +-- Create CrmObjectType
        |   {
        |     company: companyId,
        |     name: blueprint.name,
        |     apiName: blueprint.apiName,
        |     description: blueprint.description,
        |     templateOriginId: blueprint.id,    <- NEW
        |     protection: blueprint.protection   <- NEW
        |   }
        |
        +-- Store mapping: apiName -> realObjectTypeId
        |
        +-- For each BlueprintField on this object:
            +-- Create CrmObjectField
                {
                  company: companyId,
                  objectType: realObjectTypeId,
                  name: field.name,
                  apiName: field.apiName,
                  fieldType: field.fieldType,
                  ... other existing fields ...
                  templateOriginId: field.id,    <- NEW
                  protection: field.protection   <- NEW
                }

STEP 5: For each BlueprintAssociation:
        |
        +-- Resolve apiNames to real IDs
        |   sourceObjectApiName "local_move" -> UUID from step 4
        |   targetObjectApiName "lead" -> UUID from step 4
        |
        +-- Create CrmAssociationType
            {
              company: companyId,
              sourceObjectType: resolvedSourceId,
              targetObjectType: resolvedTargetId,
              ... existing fields ...
              templateOriginId: assoc.id,
              protection: assoc.protection
            }

STEP 6: Record installation
        +-- Create CompanyTemplate row
        +-- Create CompanyInstalledModule rows for each module

DONE! Company now has real entities.
      All existing APIs work unchanged.
```

---

### Flow 3: Delete Protection

```
User clicks "Delete" on "Contact" object type
                |
                v
+--------------------------------------+
|  DELETE /crm-object-type/:id         |
|                                      |
|  1. Fetch object type                |
|  2. Check protection field           |
|                                      |
|  if protection = "full"              |
|    -> 403 "Cannot delete system      |
|           object"                    |
|                                      |
|  if protection = "delete_protected"  |
|    -> 403 "Cannot delete template    |
|           object"                    |
|                                      |
|  if protection = "none" or NULL      |
|    -> Proceed with normal delete     |
+--------------------------------------+
```

Same logic applies to fields and associations.

---

### Flow 4: Add Module Later

```
User goes to: Settings -> CRM Modules
                |
                v
+------------------------------------------+
|  Your CRM: Movers                        |
|                                          |
|  INSTALLED:                              |
|  [x] Core                                |
|  [x] Local Moving          [Remove]      |
|                                          |
|  AVAILABLE:                              |
|  [ ] Long Distance         [+ Add]       |
|  [ ] Realtor Collab        [+ Add]       |
|  [ ] Storage               [+ Add]       |
|      (requires Local Moving) [check]     |
+------------------------------------------+
                |
    User clicks [+ Add] on Storage
                |
                v
+------------------------------------------+
|  1. Check dependencies                   |
|     - Storage needs ["local_moving"]     |
|     - local_moving installed? YES        |
|                                          |
|  2. Load module blueprints               |
|                                          |
|  3. Run installation for just this       |
|     module (same as step 4-5 above)      |
|                                          |
|  4. Create CompanyInstalledModule row    |
+------------------------------------------+
```

---

### Flow 5: Remove Optional Module

```
User clicks [Remove] on "Realtor Collab"
                |
                v
+------------------------------------------+
|  CHECK 1: Is module core?                |
|  - realtor_collab.isCore = false         |
|  - OK to proceed                         |
|                                          |
|  CHECK 2: Do other modules depend on it? |
|  - No other module has                   |
|    dependsOn: ["realtor_collab"]         |
|  - OK to proceed                         |
|                                          |
|  CHECK 3: Existing data?                 |
|  - Count CrmObjects where objectType     |
|    has templateOriginId from this module |
|  - If count > 0:                         |
|    "This will delete 47 records.         |
|     Continue? [Yes] [Cancel]"            |
|                                          |
|  IF CONFIRMED:                           |
|  - Delete CrmObjects                     |
|  - Delete CrmObjectFields                |
|  - Delete CrmAssociationTypes            |
|  - Delete CrmObjectTypes                 |
|  - Delete CompanyInstalledModule row     |
+------------------------------------------+
```

---

## Example: Movers Template Structure

```
CrmTemplate: "Movers CRM" (slug: movers)
|
+-- CrmTemplateModule: "Core" (isCore: true)
|   |
|   +-- BlueprintObject: "Contact" (protection: delete_protected)
|   |   +-- Field: first_name (STRING, required, protection: full)
|   |   +-- Field: last_name (STRING, required, protection: full)
|   |   +-- Field: email (EMAIL, protection: delete_protected)
|   |   +-- Field: phone (PHONE, protection: delete_protected)
|   |   +-- Field: notes (TEXTAREA, protection: none)
|   |
|   +-- BlueprintObject: "Company" (protection: delete_protected)
|   |   +-- Field: company_name (STRING, required, protection: full)
|   |   +-- Field: website (URL, protection: none)
|   |   +-- Field: industry (SELECT, protection: none)
|   |
|   +-- BlueprintObject: "Lead" (protection: delete_protected)
|   |   +-- Field: status (SELECT, required, protection: delete_protected)
|   |   |   configShape: { options: [New, Contacted, Qualified, Won, Lost] }
|   |   +-- Field: source (SELECT, protection: none)
|   |   +-- Field: value (CURRENCY, protection: none)
|   |
|   +-- BlueprintAssociation: contact_to_company
|   |   source: contact, target: company
|   |   cardinality: MANY-to-MANY
|   |   protection: delete_protected
|   |
|   +-- BlueprintAssociation: lead_to_contact
|       source: lead, target: contact
|       cardinality: ONE-to-MANY
|       protection: full
|
+-- CrmTemplateModule: "Local Moving" (isCore: false)
|   |
|   +-- BlueprintObject: "Local Move" (protection: none)
|   |   +-- Field: move_date (DATE, required)
|   |   +-- Field: origin_address (ADDRESS)
|   |   +-- Field: destination_address (ADDRESS)
|   |   +-- Field: estimated_hours (NUMBER)
|   |   +-- Field: crew_size (NUMBER)
|   |   +-- Field: hourly_rate (CURRENCY)
|   |   +-- Field: total_estimate (FORMULA)
|   |       configShape: { expression: MULTIPLY(estimated_hours, hourly_rate, crew_size) }
|   |
|   +-- BlueprintObject: "Inventory Item" (protection: none)
|   |   +-- Field: item_name (STRING)
|   |   +-- Field: room (SELECT)
|   |   +-- Field: special_handling (BOOLEAN)
|   |
|   +-- BlueprintAssociation: move_to_lead
|   |   source: local_move, target: lead
|   |   cardinality: ONE-to-ONE
|   |
|   +-- BlueprintAssociation: move_inventory
|       source: local_move, target: inventory_item
|       cardinality: ONE-to-MANY
|
+-- CrmTemplateModule: "Long Distance" (isCore: false)
|   |
|   +-- BlueprintObject: "Long Distance Move" (protection: none)
|   |   +-- Field: move_date (DATE, required)
|   |   +-- Field: origin_state (SELECT)
|   |   +-- Field: destination_state (SELECT)
|   |   +-- Field: distance_miles (NUMBER)
|   |   +-- Field: weight_lbs (NUMBER)
|   |   +-- Field: binding_estimate (CURRENCY)
|   |   +-- Field: dot_number (STRING)
|   |
|   +-- BlueprintAssociation: ld_move_to_lead
|       source: long_distance_move, target: lead
|
+-- CrmTemplateModule: "Realtor Collaboration" (isCore: false)
|   |
|   +-- BlueprintObject: "Realtor Partner" (protection: none)
|   |   +-- Field: realtor_name (STRING, required)
|   |   +-- Field: brokerage (STRING)
|   |   +-- Field: email (EMAIL)
|   |   +-- Field: phone (PHONE)
|   |   +-- Field: commission_rate (NUMBER)
|   |   +-- Field: total_referrals (FORMULA - rollup count)
|   |
|   +-- BlueprintObject: "Realtor Referral" (protection: none)
|   |   +-- Field: referral_date (DATE)
|   |   +-- Field: commission_paid (CURRENCY)
|   |   +-- Field: status (SELECT: Pending, Booked, Completed, Paid)
|   |
|   +-- BlueprintAssociation: realtor_referrals
|   |   source: realtor_partner, target: realtor_referral
|   |   cardinality: ONE-to-MANY
|   |
|   +-- BlueprintAssociation: referral_to_lead
|       source: realtor_referral, target: lead
|
+-- CrmTemplateModule: "Storage Services" (isCore: false, dependsOn: ["local_moving"])
    |
    +-- BlueprintObject: "Storage Unit" (protection: none)
    |   +-- Field: unit_number (STRING)
    |   +-- Field: size (SELECT: 5x5, 5x10, 10x10, 10x15, 10x20)
    |   +-- Field: monthly_rate (CURRENCY)
    |   +-- Field: is_available (BOOLEAN)
    |
    +-- BlueprintObject: "Storage Rental" (protection: none)
    |   +-- Field: start_date (DATE)
    |   +-- Field: end_date (DATE)
    |   +-- Field: status (SELECT: Active, Ended, Delinquent)
    |
    +-- BlueprintAssociation: rental_to_unit
    |   source: storage_rental, target: storage_unit
    |   cardinality: MANY-to-ONE
    |
    +-- BlueprintAssociation: rental_to_move
        source: storage_rental, target: local_move  <- cross-module reference!
        cardinality: ONE-to-MANY
```

---

## API Endpoints

### Public - Browse Templates

```
GET /templates
    -> [{ id, name, slug, description, icon }]

GET /templates/:slug
    -> { template details + modules list }

GET /templates/:slug/preview
    -> { all objects/fields/associations that would be created }
```

### Registration with Template

```
POST /auth/register-with-template
{
  email: "user@example.com",
  password: "...",
  companyName: "ABC Movers",
  templateSlug: "movers",
  modules: ["local_moving", "realtor_collab"]
}
    -> { user, company, installedModules }
```

### Module Management (Authenticated)

```
GET /company/template
    -> { template, installedModules, availableModules }

POST /company/modules/:slug/install
    -> { success, createdObjects, createdFields, createdAssociations }

POST /company/modules/:slug/uninstall
    -> { success, deletedCount }
    (or 400 if core/has dependents)
```

### Existing APIs (Unchanged, but with protection)

```
GET  /crm-object-type           -> still works
POST /crm-object-type           -> still works (custom objects have null templateOriginId)
DELETE /crm-object-type/:id     -> checks protection first

Same for fields and associations
```

---

## Protection Enum Values

```typescript
enum TemplateItemProtection {
  // Cannot delete, cannot modify core attributes
  // Use for: essential fields like first_name, last_name, email
  FULL = 'full',

  // Cannot delete, but can modify (add fields, change config)
  // Use for: core objects like Contact, Lead - must exist but customizable
  DELETE_PROTECTED = 'delete_protected',

  // No restrictions - treat as user-created
  // Use for: optional objects/fields user might not want
  NONE = 'none',
}
```

---

## Why This Architecture Scales

| Challenge | Solution |
|-----------|----------|
| **Add new industry** | Create new CrmTemplate + modules in DB, no code change |
| **Add module to template** | Add CrmTemplateModule + blueprints |
| **User customization** | Users use existing APIs, their custom stuff has templateOriginId = null |
| **Template updates** | Blueprints are separate from reality - updating doesn't affect existing companies |
| **Query performance** | Existing indexes work, add index on templateOriginId if needed |
| **Backward compatibility** | Existing companies work fine with null templateOriginId |
| **Cross-module references** | Associations can reference objects from any installed module |

---

## Open Questions / Future Considerations

### 1. Template Versioning
- What happens when we update a template?
- Do existing users get updates automatically?
- Probably: NO automatic updates, but offer "upgrade" feature

### 2. Multiple Templates per Company?
- Current design: one template per company
- Could allow mixing modules from different templates
- Adds complexity - start simple

### 3. Field Protection Granularity
- Current: protect whole field
- Future: protect specific aspects (name yes, configShape no)

### 4. Soft Delete vs Hard Delete for Modules
- Current: hard delete when removing module
- Alternative: soft delete, allow "restore module"

### 5. Template Marketplace
- Future: allow third parties to create templates
- Would need review/approval process

---

## Implementation Priority

### Phase 1: Foundation
1. Create blueprint entities (5 tables)
2. Create tracking entities (2 tables)
3. Add columns to existing entities (6 columns total)
4. Protection enum

### Phase 2: Installation
1. Template installation service
2. Registration flow integration
3. Protection checking in delete operations

### Phase 3: Management
1. Module install/uninstall endpoints
2. Settings UI for module management
3. Template browsing API

### Phase 4: Content
1. Movers template seed data
2. Realtors template seed data
3. Admin UI for template management

---

## File Structure (Proposed)

```
src/api/
  templates/
    entities/
      crm-template.entity.ts
      crm-template-module.entity.ts
      crm-template-blueprint-object.entity.ts
      crm-template-blueprint-field.entity.ts
      crm-template-blueprint-association.entity.ts
      company-template.entity.ts
      company-installed-module.entity.ts

    dto/
      template-response.dto.ts
      install-template.dto.ts
      module-management.dto.ts

    templates.controller.ts
    templates.service.ts
    templates.module.ts

    installation/
      template-installation.service.ts
      module-installation.service.ts

    seeds/
      movers.template.ts
      realtors.template.ts

  enums/
    template/
      template-item-protection.enum.ts
```

ADDITION

⏺ This is a brilliant idea. It's a well-proven pattern used everywhere:

| System     | Convention            |
  |------------|-----------------------|
| PostgreSQL | pg_tables, pg_indexes |
| MongoDB    | _id, __v              |
| JavaScript | _private, __proto__   |
| Python     | _internal, __dunder__ |
| CSS        | --variables           |

Your Convention

Template/System:  _contact, _lead, _first_name, _move_to_lead
User-created:     contact, my_lead, custom_field (must start with letter)

Why It's Better Than What I Proposed

Before (collision risk):
1. User creates "contact" object
2. User installs template
3. Template tries to create "contact"
4. CONFLICT! What do we do? Merge? Rename? Error?

After (no collision possible):
1. User creates "contact" object
2. User installs template
3. Template creates "_contact"
4. Both exist peacefully, zero conflict

Validation Rules

Template apiNames:  /^_[a-z][a-z0-9_]*$/    →  _contact, _first_name
User apiNames:      /^[a-z][a-z0-9_]*$/     →  contact, my_field

User CANNOT start with:  _ (underscore)

Added Bonus: Instant Recognition

When you see an apiName anywhere (logs, API responses, database), you immediately know:

_contact        → from template, has protection rules
contact         → user created, fully deletable
_first_name     → system field, probably protected
custom_field    → user's custom field

One Small Refinement

You could even go further with prefixes if needed later:

_contact           → core template object
_lm_local_move     → from "local_moving" module (lm prefix)
_rc_realtor        → from "realtor_collab" module (rc prefix)

But starting simple with just _ prefix is perfect. You can always extend later.