# Template Management - Enhanced Testing Checklist

> Comprehensive test cases for every endpoint, error code, and edge case.
> Each checkbox should be verified before considering an endpoint complete.

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [Templates CRUD](#2-templates-crud)
3. [Modules CRUD](#3-modules-crud)
4. [Blueprint Objects CRUD](#4-blueprint-objects-crud)
5. [Blueprint Fields CRUD](#5-blueprint-fields-crud)
6. [Blueprint Associations CRUD](#6-blueprint-associations-crud)
7. [Installation Operations](#7-installation-operations)
8. [Reorder Operations](#8-reorder-operations)
9. [Protection Levels](#9-protection-levels)
10. [Cascade Behavior](#10-cascade-behavior)
11. [Concurrency & Race Conditions](#11-concurrency--race-conditions)
12. [Performance & Limits](#12-performance--limits)

---

## 1. Authentication & Authorization

> These tests apply to ALL endpoints

### 1.1 Authentication Tests

| Test Case | Endpoint | Expected | Status |
|-----------|----------|----------|--------|
| No auth header | ANY | 401 `Authentication required` | ⬜ |
| Invalid JWT format | ANY | 401 `Invalid or expired token` | ⬜ |
| Expired JWT | ANY | 401 `Your session has expired. Please sign in again.` | ⬜ |
| Malformed JWT | ANY | 401 `Invalid or expired token` | ⬜ |

### 1.2 Authorization Tests

| Test Case | Endpoint | Expected | Status |
|-----------|----------|----------|--------|
| Client user (not admin) | ANY | 403 `You do not have permission to perform this action` | ⬜ |
| Admin with role=viewer on write | POST/PATCH/DELETE | 403 `You do not have permission to perform this action` | ⬜ |
| Admin with role=editor | POST/PATCH/DELETE | 200/201 Success | ⬜ |
| Super admin | ANY | 200/201 Success | ⬜ |

---

## 2. Templates CRUD

### 2.1 GET /admin/templates (List)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| List with default pagination | 200 + paginated result | ⬜ |
| List with limit=10, offset=0 | First 10 templates | ⬜ |
| List with limit=10, offset=10 | Second page | ⬜ |
| List with searchQuery | Filtered results | ⬜ |
| List with isActive=true | Only active templates | ⬜ |
| List with isActive=false | Only inactive templates | ⬜ |
| Empty result | 200 + empty array, totalRecords=0 | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| limit=0 | 400 `Validation failed` | ⬜ |
| limit=-1 | 400 `Validation failed` | ⬜ |
| limit=101 (exceeds max) | 400 `Validation failed` | ⬜ |
| offset=-1 | 400 `Validation failed` | ⬜ |
| limit=abc (not a number) | 400 `Validation failed` | ⬜ |

---

### 2.2 POST /admin/templates (Create)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Create with name + slug | 201 + { id } | ⬜ |
| Create with all fields | 201 + { id } | ⬜ |
| Create with isActive=false | 201, template inactive | ⬜ |
| Create with displayOrder=5 | 201, correct order | ⬜ |
| Slug with underscores `my_template` | 201 Success | ⬜ |
| Slug with hyphens `my-template` | 201 Success | ⬜ |
| Slug with numbers `template123` | 201 Success | ⬜ |

#### Error Cases - Validation
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing name | 400 `Validation failed` | ⬜ |
| Missing slug | 400 `Validation failed` | ⬜ |
| Empty name | 400 `Validation failed` | ⬜ |
| Empty slug | 400 `Validation failed` | ⬜ |
| Name > 255 chars | 400 `Validation failed` | ⬜ |
| Slug > 100 chars | 400 `Validation failed` | ⬜ |
| Slug with spaces | 400 `Slug must contain only lowercase letters, numbers, underscores, and hyphens` | ⬜ |
| Slug with uppercase | 400 `Slug must contain only lowercase letters, numbers, underscores, and hyphens` | ⬜ |
| Slug with special chars | 400 `Slug must contain only lowercase letters, numbers, underscores, and hyphens` | ⬜ |

#### Error Cases - Business Logic
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Duplicate slug | 409 `A template with this slug already exists` | ⬜ |

---

### 2.3 GET /admin/templates/:id (Get by ID)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid UUID exists | 200 + template data | ⬜ |
| Response includes modulesCount | Correct count | ⬜ |
| Response includes companiesCount | Correct count | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent UUID | 404 `Template not found` | ⬜ |
| Invalid UUID format | 400 `Invalid ID format` | ⬜ |
| Empty ID | 400 `Invalid ID format` | ⬜ |

---

### 2.4 GET /admin/templates/slug/:slug (Get by Slug)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid slug exists | 200 + template data | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent slug | 404 `Template not found` | ⬜ |
| Empty slug | 404 `Template not found` | ⬜ |

---

### 2.5 GET /admin/templates/slug/:slug/available (Check Availability)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Slug not taken | 200 + { available: true } | ⬜ |
| Slug is taken | 200 + { available: false } | ⬜ |

---

### 2.6 PATCH /admin/templates/:id (Update)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Update name only | 200 Success | ⬜ |
| Update description | 200 Success | ⬜ |
| Update icon | 200 Success | ⬜ |
| Update isActive true→false | 200 Success | ⬜ |
| Update isActive false→true | 200 Success | ⬜ |
| Update displayOrder | 200 Success | ⬜ |
| Update multiple fields | 200 Success | ⬜ |
| Empty body (no changes) | 200 Success | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Template not found` | ⬜ |
| Invalid UUID | 400 `Invalid ID format` | ⬜ |
| Name > 255 chars | 400 `Validation failed` | ⬜ |
| Invalid displayOrder type | 400 `Validation failed` | ⬜ |

#### Edge Cases
| Test Case | Expected | Status |
|-----------|----------|--------|
| Update installed template name | 200 Success (allowed) | ⬜ |
| Concurrent updates | Last write wins or conflict | ⬜ |

---

### 2.7 DELETE /admin/templates/:id (Delete)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete template with no modules | 200 Success | ⬜ |
| Delete template with modules | 200 + cascade delete | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Template not found` | ⬜ |
| Invalid UUID | 400 `Invalid ID format` | ⬜ |
| Template installed by company | 409 `Cannot modify or delete template while it is installed by companies` | ⬜ |

#### Cascade Verification
| Test Case | Expected | Status |
|-----------|----------|--------|
| After delete: modules gone | Modules not found | ⬜ |
| After delete: objects gone | Objects not found | ⬜ |
| After delete: fields gone | Fields not found | ⬜ |
| After delete: associations gone | Associations not found | ⬜ |

---

## 3. Modules CRUD

### 3.1 GET /admin/templates/modules (List)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| List by templateId | Only modules for that template | ⬜ |
| List with pagination | Paginated result | ⬜ |
| Empty result | 200 + empty array | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing templateId | 400 `Validation failed` | ⬜ |
| Invalid templateId UUID | 400 `Invalid ID format` | ⬜ |
| Non-existent templateId | 404 `Template not found` | ⬜ |

---

### 3.2 POST /admin/templates/modules (Create)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Create with required fields | 201 + { id } | ⬜ |
| Create with isCore=true | 201, module is core | ⬜ |
| Create with isCore=false | 201, module is optional | ⬜ |
| Create with dependsOn | 201, dependencies set | ⬜ |
| Create with conflictsWith | 201, conflicts set | ⬜ |
| Create with displayOrder | 201, correct order | ⬜ |

#### Error Cases - Validation
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing templateId | 400 `Validation failed` | ⬜ |
| Missing name | 400 `Validation failed` | ⬜ |
| Missing slug | 400 `Validation failed` | ⬜ |
| Invalid templateId UUID | 400 `Invalid ID format` | ⬜ |
| Slug with invalid chars | 400 `Slug must contain only lowercase letters, numbers, underscores, and hyphens` | ⬜ |

#### Error Cases - Business Logic
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent templateId | 404 `Template not found` | ⬜ |
| Duplicate slug in template | 409 `A module with this slug already exists in this template` | ⬜ |
| Template has 50 modules | 400 `Maximum number of modules per template exceeded (limit: 50)` | ⬜ |

---

### 3.3 GET /admin/templates/modules/:id (Get by ID)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid ID | 200 + module data | ⬜ |
| Includes objectsCount | Correct count | ⬜ |
| Includes associationsCount | Correct count | ⬜ |
| Includes companiesInstalled | Correct count | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Module not found` | ⬜ |
| Invalid UUID | 400 `Invalid ID format` | ⬜ |

---

### 3.4 GET /admin/templates/modules/:id/full (Get with Tree)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Module with objects and fields | Complete tree structure | ⬜ |
| Module with associations | Associations included | ⬜ |
| Empty module | Module with empty arrays | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Module not found` | ⬜ |

---

### 3.5 PATCH /admin/templates/modules/:id (Update)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Update name | 200 Success | ⬜ |
| Update description | 200 Success | ⬜ |
| Update isCore | 200 Success | ⬜ |
| Update dependsOn | 200 Success | ⬜ |
| Update conflictsWith | 200 Success | ⬜ |
| Update displayOrder | 200 Success | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Module not found` | ⬜ |
| Module installed by company | 409 `Cannot modify or delete module while it is installed by companies` | ⬜ |

---

### 3.6 DELETE /admin/templates/modules/:id (Delete)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete empty module | 200 Success | ⬜ |
| Delete module with objects | 200 + cascade | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Module not found` | ⬜ |
| Module installed by company | 409 `Cannot modify or delete module while it is installed by companies` | ⬜ |

---

## 4. Blueprint Objects CRUD

### 4.1 GET /admin/templates/blueprint-objects (List)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| List by moduleId | Only objects for that module | ⬜ |
| Objects ordered by displayOrder | Correct order | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing moduleId | 400 `Validation failed` | ⬜ |
| Non-existent moduleId | 404 `Module not found` | ⬜ |

---

### 4.2 POST /admin/templates/blueprint-objects (Create)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Create with required fields | 201 + { id } | ⬜ |
| apiName starts with _ | 201 Success | ⬜ |
| apiName lowercase only | 201 Success | ⬜ |
| Create with protection=FULL | 201, protected | ⬜ |
| Create with protection=DELETE_PROTECTED | 201 Success | ⬜ |
| Create with protection=NONE | 201 Success | ⬜ |

#### Error Cases - Validation
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing moduleId | 400 `Validation failed` | ⬜ |
| Missing name | 400 `Validation failed` | ⬜ |
| Missing apiName | 400 `Validation failed` | ⬜ |
| apiName without _ prefix | 400 `Validation failed` | ⬜ |
| apiName with uppercase | 400 `Validation failed` | ⬜ |
| apiName with spaces | 400 `Validation failed` | ⬜ |

#### Error Cases - Business Logic
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent moduleId | 404 `Module not found` | ⬜ |
| Duplicate apiName in module | 409 `An object with this API name already exists in this module` | ⬜ |
| Module has 100 objects | 400 `Maximum number of objects per module exceeded (limit: 100)` | ⬜ |

---

### 4.3 GET /admin/templates/blueprint-objects/:id (Get by ID)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid ID | 200 + object data | ⬜ |
| Includes fieldsCount | Correct count | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Blueprint object not found` | ⬜ |

---

### 4.4 GET /admin/templates/blueprint-objects/:id/with-fields (Get with Fields)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Object with fields | All fields included | ⬜ |
| Fields ordered by displayOrder | Correct order | ⬜ |
| Empty object | Object with empty fields array | ⬜ |

---

### 4.5 PATCH /admin/templates/blueprint-objects/:id (Update)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Update name | 200 Success | ⬜ |
| Update description | 200 Success | ⬜ |
| Update protection level | 200 Success | ⬜ |
| Update displayOrder | 200 Success | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Blueprint object not found` | ⬜ |
| Object is protected (FULL) | 403 `This object is protected and cannot be modified` | ⬜ |

#### Cannot Change
| Test Case | Expected | Status |
|-----------|----------|--------|
| Attempt to change apiName | Should be ignored or error | ⬜ |
| Attempt to change moduleId | Should be ignored or error | ⬜ |

---

### 4.6 DELETE /admin/templates/blueprint-objects/:id (Delete)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete object with no fields | 200 Success | ⬜ |
| Delete object with fields | 200 + cascade delete fields | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Blueprint object not found` | ⬜ |
| Object is protected | 403 `This object is protected and cannot be modified` | ⬜ |
| Object referenced in association | 400 (depends on implementation) | ⬜ |

---

## 5. Blueprint Fields CRUD

### 5.1 GET /admin/templates/blueprint-fields (List)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| List by objectId | Only fields for that object | ⬜ |
| Fields ordered by displayOrder | Correct order | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing objectId | 400 `Validation failed` | ⬜ |
| Non-existent objectId | 404 `Blueprint object not found` | ⬜ |

---

### 5.2 POST /admin/templates/blueprint-fields (Create)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Create TEXT field | 201 + { id } | ⬜ |
| Create NUMBER field | 201 Success | ⬜ |
| Create DATE field | 201 Success | ⬜ |
| Create DATETIME field | 201 Success | ⬜ |
| Create BOOLEAN field | 201 Success | ⬜ |
| Create SELECT field with options | 201 Success | ⬜ |
| Create MULTISELECT field | 201 Success | ⬜ |
| Create TEXTAREA field | 201 Success | ⬜ |
| Create EMAIL field | 201 Success | ⬜ |
| Create PHONE field | 201 Success | ⬜ |
| Create URL field | 201 Success | ⬜ |
| Create with isRequired=true | 201, field required | ⬜ |
| Create with shape config | 201, config saved | ⬜ |
| Create with configShape | 201, config saved | ⬜ |
| Create with protection | 201, protected | ⬜ |

#### Error Cases - Validation
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing blueprintObjectId | 400 `Validation failed` | ⬜ |
| Missing name | 400 `Validation failed` | ⬜ |
| Missing apiName | 400 `Validation failed` | ⬜ |
| Missing fieldType | 400 `Validation failed` | ⬜ |
| Invalid fieldType | 400 `Invalid field type provided` | ⬜ |
| apiName without _ prefix | 400 `Validation failed` | ⬜ |
| SELECT without options | 400 `Field configuration is invalid for this field type` | ⬜ |

#### Error Cases - Business Logic
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent objectId | 404 `Blueprint object not found` | ⬜ |
| Duplicate apiName in object | 409 `A field with this API name already exists in this object` | ⬜ |
| Object has 200 fields | 400 `Maximum number of fields per object exceeded (limit: 200)` | ⬜ |

---

### 5.3 POST /admin/templates/blueprint-fields/bulk (Bulk Create)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Create 5 fields at once | 201 + { ids: [...] } | ⬜ |
| Create 50 fields (max) | 201 Success | ⬜ |
| All fields have unique apiNames | 201 Success | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Create 51 fields (exceeds max) | 400 `Bulk create limit exceeded (limit: 50 fields per request)` | ⬜ |
| Duplicate apiNames in batch | 409 `A field with this API name already exists in this object` | ⬜ |
| One invalid field in batch | 400 + entire batch rejected | ⬜ |
| Empty fields array | 400 `Validation failed` | ⬜ |

---

### 5.4 GET /admin/templates/blueprint-fields/:id (Get by ID)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid ID | 200 + field data | ⬜ |
| Response includes shape | Shape data present | ⬜ |
| Response includes configShape | ConfigShape data present | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Blueprint field not found` | ⬜ |

---

### 5.5 PATCH /admin/templates/blueprint-fields/:id (Update)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Update name | 200 Success | ⬜ |
| Update description | 200 Success | ⬜ |
| Update isRequired | 200 Success | ⬜ |
| Update shape | 200 Success | ⬜ |
| Update configShape | 200 Success | ⬜ |
| Update protection | 200 Success | ⬜ |
| Update displayOrder | 200 Success | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Blueprint field not found` | ⬜ |
| Field is protected (FULL) | 403 `This field is protected and cannot be modified` | ⬜ |

#### Cannot Change
| Test Case | Expected | Status |
|-----------|----------|--------|
| Attempt to change apiName | Should be ignored or error | ⬜ |
| Attempt to change fieldType | Should be ignored or error | ⬜ |
| Attempt to change objectId | Should be ignored or error | ⬜ |

---

### 5.6 DELETE /admin/templates/blueprint-fields/:id (Delete)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete field | 200 Success | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Blueprint field not found` | ⬜ |
| Field is protected | 403 `This field is protected and cannot be modified` | ⬜ |

---

## 6. Blueprint Associations CRUD

### 6.1 GET /admin/templates/blueprint-associations (List)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| List by moduleId | Only associations for that module | ⬜ |
| Associations ordered by displayOrder | Correct order | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing moduleId | 400 `Validation failed` | ⬜ |
| Non-existent moduleId | 404 `Module not found` | ⬜ |

---

### 6.2 POST /admin/templates/blueprint-associations (Create)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Create one-to-many | 201 + { id } | ⬜ |
| Create many-to-many | 201 Success | ⬜ |
| Create one-to-one | 201 Success | ⬜ |
| Create bidirectional | 201, both directions | ⬜ |
| Create unidirectional | 201, one direction | ⬜ |
| Create with reverseName | 201, reverse name set | ⬜ |
| Create with protection | 201, protected | ⬜ |

#### Error Cases - Validation
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing moduleId | 400 `Validation failed` | ⬜ |
| Missing name | 400 `Validation failed` | ⬜ |
| Missing apiName | 400 `Validation failed` | ⬜ |
| Missing sourceObjectApiName | 400 `Validation failed` | ⬜ |
| Missing targetObjectApiName | 400 `Validation failed` | ⬜ |
| Missing cardinalities | 400 `Validation failed` | ⬜ |
| Invalid cardinality value | 400 `Validation failed` | ⬜ |

#### Error Cases - Business Logic
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent moduleId | 404 `Module not found` | ⬜ |
| sourceObjectApiName doesn't exist | 400 `Source object does not exist` | ⬜ |
| targetObjectApiName doesn't exist | 400 `Target object does not exist` | ⬜ |
| Duplicate apiName in module | 409 `An association with this API name already exists in this module` | ⬜ |
| Same source and target (self-ref) | Depends on implementation | ⬜ |
| Duplicate association between same objects | 409 `An association between these objects already exists` | ⬜ |

---

### 6.3 GET /admin/templates/blueprint-associations/:id (Get by ID)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid ID | 200 + association data | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Blueprint association not found` | ⬜ |

---

### 6.4 PATCH /admin/templates/blueprint-associations/:id (Update)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Update name | 200 Success | ⬜ |
| Update description | 200 Success | ⬜ |
| Update reverseName | 200 Success | ⬜ |
| Update isBidirectional | 200 Success | ⬜ |
| Update protection | 200 Success | ⬜ |
| Update displayOrder | 200 Success | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Blueprint association not found` | ⬜ |
| Association is protected | 403 `This association is protected and cannot be modified` | ⬜ |

#### Cannot Change
| Test Case | Expected | Status |
|-----------|----------|--------|
| Attempt to change sourceObjectApiName | Should be ignored or error | ⬜ |
| Attempt to change targetObjectApiName | Should be ignored or error | ⬜ |
| Attempt to change cardinalities | Should be ignored or error | ⬜ |

---

### 6.5 DELETE /admin/templates/blueprint-associations/:id (Delete)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete association | 200 Success | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent ID | 404 `Blueprint association not found` | ⬜ |
| Association is protected | 403 `This association is protected and cannot be modified` | ⬜ |

---

## 7. Installation Operations

### 7.1 POST /admin/templates/install (Install Template)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Install with specific modules | 201 + InstallationResultDto | ⬜ |
| Install with installAllModules=true | 201, all modules installed | ⬜ |
| Core modules auto-included | Core always installed | ⬜ |
| Creates CRM object types | Correct object types created | ⬜ |
| Creates CRM fields | Correct fields created | ⬜ |
| Creates CRM associations | Correct associations created | ⬜ |
| Sets templateOriginId | Origin tracked on entities | ⬜ |
| Applies protection levels | Protection enforced | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing companyId | 400 `Validation failed` | ⬜ |
| Missing templateSlug | 400 `Validation failed` | ⬜ |
| Invalid companyId | 400 `Invalid ID format` | ⬜ |
| Non-existent companyId | 404 `Company not found` | ⬜ |
| Non-existent templateSlug | 404 `Template not found` | ⬜ |
| Template inactive | 400 `Template is not active and cannot be installed` | ⬜ |
| Company already has template | 409 `This company already has a template installed` | ⬜ |
| Module doesn't exist | 400 `Module not found` | ⬜ |
| Module dependency missing | 400 `Required dependency modules must be installed first` | ⬜ |

#### Rollback Tests
| Test Case | Expected | Status |
|-----------|----------|--------|
| Failure mid-installation | Full rollback, no partial data | ⬜ |
| Verify no orphan records | All or nothing | ⬜ |

---

### 7.2 POST /admin/templates/install-module (Install Module)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Add optional module | 201 + InstallationResultDto | ⬜ |
| Dependencies auto-installed | Dependencies included | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Company has no template | 400 `This company does not have a template installed` | ⬜ |
| Module already installed | 409 `This module is already installed for this company` | ⬜ |
| Module from different template | 400 (depends on implementation) | ⬜ |
| Module conflicts with existing | 409 `This module conflicts with an already installed module` | ⬜ |
| Missing dependency | 400 `Required dependency modules must be installed first` | ⬜ |

---

### 7.3 POST /admin/templates/uninstall-module (Uninstall Module)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Uninstall with no data | 200 + UninstallModuleResponseDto | ⬜ |
| Uninstall with force=true | 200, data deleted | ⬜ |
| Response includes deletedCount | Correct count | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Module not installed | 400 `This module is not installed for this company` | ⬜ |
| Core module | 400 `Core modules cannot be uninstalled` | ⬜ |
| Has data, force=false | 400 `Cannot uninstall module with existing data. Use force option to delete all data.` | ⬜ |
| Other modules depend on this | 400 `Required dependency modules must be installed first` (reverse check) | ⬜ |

---

### 7.4 GET /admin/templates/company/:companyId (Installation Status)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Company with template | 200 + { template, modules } | ⬜ |
| Company without template | 200 + { template: null, modules: [] } | ⬜ |
| Modules sorted by displayOrder | Correct order | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Invalid companyId | 400 `Invalid ID format` | ⬜ |
| Non-existent companyId | 404 `Company not found` | ⬜ |

---

## 8. Reorder Operations

### 8.1 POST /admin/templates/modules/:templateId/reorder

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Reorder all modules | 200, order updated | ⬜ |
| Partial reorder | 200, specified order, rest unchanged | ⬜ |
| Empty array | 200, no changes | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent templateId | 404 `Template not found` | ⬜ |
| Invalid module ID in array | 400 `One or more IDs in the reorder array are invalid` | ⬜ |
| Duplicate IDs in array | 400 `Reorder array contains duplicate IDs` | ⬜ |
| Module from different template | 400 `One or more IDs in the reorder array are invalid` | ⬜ |

---

### 8.2 POST /admin/templates/blueprint-objects/:moduleId/reorder

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Reorder all objects | 200, order updated | ⬜ |
| Partial reorder | 200, specified order, rest unchanged | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent moduleId | 404 `Module not found` | ⬜ |
| Invalid object ID | 400 `One or more IDs in the reorder array are invalid` | ⬜ |
| Duplicate IDs | 400 `Reorder array contains duplicate IDs` | ⬜ |

---

### 8.3 POST /admin/templates/blueprint-fields/:objectId/reorder

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Reorder all fields | 200, order updated | ⬜ |
| Partial reorder | 200, specified order, rest unchanged | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent objectId | 404 `Blueprint object not found` | ⬜ |
| Invalid field ID | 400 `One or more IDs in the reorder array are invalid` | ⬜ |
| Duplicate IDs | 400 `Reorder array contains duplicate IDs` | ⬜ |

---

## 9. Protection Levels

### 9.1 FULL Protection

| Test Case | Entity | Expected | Status |
|-----------|--------|----------|--------|
| Update protected object | Object | 403 `This object is protected and cannot be modified` | ⬜ |
| Delete protected object | Object | 403 `This object is protected and cannot be modified` | ⬜ |
| Update protected field | Field | 403 `This field is protected and cannot be modified` | ⬜ |
| Delete protected field | Field | 403 `This field is protected and cannot be modified` | ⬜ |
| Update protected association | Association | 403 `This association is protected and cannot be modified` | ⬜ |
| Delete protected association | Association | 403 `This association is protected and cannot be modified` | ⬜ |

### 9.2 DELETE_PROTECTED Protection

| Test Case | Entity | Expected | Status |
|-----------|--------|----------|--------|
| Update delete-protected object | Object | 200 Success (allowed) | ⬜ |
| Delete delete-protected object | Object | 403 `This object is protected and cannot be modified` | ⬜ |
| Update delete-protected field | Field | 200 Success (allowed) | ⬜ |
| Delete delete-protected field | Field | 403 `This field is protected and cannot be modified` | ⬜ |

### 9.3 NONE Protection

| Test Case | Entity | Expected | Status |
|-----------|--------|----------|--------|
| Update unprotected object | Object | 200 Success | ⬜ |
| Delete unprotected object | Object | 200 Success | ⬜ |
| Update unprotected field | Field | 200 Success | ⬜ |
| Delete unprotected field | Field | 200 Success | ⬜ |

---

## 10. Cascade Behavior

### 10.1 Template Delete Cascade

| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete template | All modules deleted | ⬜ |
| Delete template | All objects deleted | ⬜ |
| Delete template | All fields deleted | ⬜ |
| Delete template | All associations deleted | ⬜ |
| Delete installed template | BLOCKED (409) | ⬜ |

### 10.2 Module Delete Cascade

| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete module | All objects deleted | ⬜ |
| Delete module | All fields deleted | ⬜ |
| Delete module | All associations deleted | ⬜ |
| Delete installed module | BLOCKED (409) | ⬜ |

### 10.3 Object Delete Cascade

| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete object | All fields deleted | ⬜ |
| Delete object | Associations referencing it? | ⬜ |

---

## 11. Concurrency & Race Conditions

### 11.1 Concurrent Operations

| Test Case | Expected | Status |
|-----------|----------|--------|
| Two users create same slug simultaneously | One succeeds, one gets 409 | ⬜ |
| Two users delete same template | One succeeds, one gets 404 | ⬜ |
| Install while template being deleted | Proper error handling | ⬜ |
| Update while module being deleted | Proper error handling | ⬜ |

### 11.2 Transaction Isolation

| Test Case | Expected | Status |
|-----------|----------|--------|
| Installation rollback | No partial data | ⬜ |
| Bulk create rollback | No partial data | ⬜ |
| Cascade delete atomicity | All or nothing | ⬜ |

---

## 12. Performance & Limits

### 12.1 Limits Enforcement

| Test Case | Limit | Expected | Status |
|-----------|-------|----------|--------|
| 51st module in template | 50 | 400 `Maximum number of modules per template exceeded (limit: 50)` | ⬜ |
| 101st object in module | 100 | 400 `Maximum number of objects per module exceeded (limit: 100)` | ⬜ |
| 201st field in object | 200 | 400 `Maximum number of fields per object exceeded (limit: 200)` | ⬜ |
| 51 fields in bulk create | 50 | 400 `Bulk create limit exceeded (limit: 50 fields per request)` | ⬜ |

### 12.2 Large Data Sets

| Test Case | Expected | Status |
|-----------|----------|--------|
| List 1000 templates (pagination) | Performs well | ⬜ |
| Get module/full with 100 objects, 200 fields each | Performs well | ⬜ |
| Install template with 50 modules | Completes successfully | ⬜ |
| Bulk create 50 fields | Completes quickly | ⬜ |

---

## Summary Statistics

```
Total Test Cases: ~250+

Categories:
- Authentication & Authorization: 8
- Templates CRUD: 45
- Modules CRUD: 35
- Blueprint Objects CRUD: 35
- Blueprint Fields CRUD: 50
- Blueprint Associations CRUD: 30
- Installation Operations: 30
- Reorder Operations: 15
- Protection Levels: 12
- Cascade Behavior: 10
- Concurrency: 6
- Performance: 8
```

---

## Test Execution Log

| Date | Tester | Group Tested | Pass/Fail | Notes |
|------|--------|--------------|-----------|-------|
| | | | | |
| | | | | |
| | | | | |
