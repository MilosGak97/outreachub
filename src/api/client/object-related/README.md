# Object-Related Module — v2

`ObjectRelatedModule` is the CRM engine of the client API. It provides everything needed to define a custom data model (object types, fields, association types) and then create, query, and relate records against that model. Every piece of data is scoped to the caller's company via `UserAuthGuard` + `CompanyContext`.

---

## Directory Structure

```
object-related/
├── object-related.module.ts
├── crm-object-type/          # Schema: define object types (Contact, Deal, etc.)
├── crm-object-field/         # Schema: define fields on those types
│   ├── field-types/          # Registry of all supported field types + metadata
│   └── formula/              # Formula expression tree engine
├── crm-association-type/     # Schema: define relationship types between object types
├── crm-object/               # Data: CRUD on actual records
│   └── services/             # Field validation, protected-field handling
├── crm-object-association/   # Data: link records together
└── import/                   # Bulk data ingestion from CSV
```

---

## Core Concepts

### The Two Layers

| Layer | What it is | Examples |
|-------|-----------|---------|
| **Schema** | Definitions of shape | `CrmObjectType`, `CrmObjectField`, `CrmAssociationType` |
| **Data** | Actual records | `CrmObject`, `CrmObjectAssociation` |

Schema is defined once per company. Data lives under a schema.

### Multi-Tenant Scoping

`UserAuthGuard` validates the JWT and writes `companyId` into a request-local CLS context. `BaseCompanyRepository` (extended by all repositories here) automatically appends `WHERE company_id = ?` to every query — callers never pass `companyId` explicitly.

---

## Entities

### `CrmObjectType`
Defines a named entity category (think "Contact" or "Deal").

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `name` | string | Display label |
| `apiName` | string | snake_case, company-unique |
| `description` | string? | Optional |
| `protection` | enum? | Template protection level |
| `fields` | `CrmObjectField[]` | One-to-many |
| `objects` | `CrmObject[]` | One-to-many |

### `CrmObjectField`
One field definition on a `CrmObjectType`.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `objectType` | `CrmObjectType` | Parent type (cascade delete) |
| `name` | string | Display label |
| `apiName` | string | snake_case, company-unique |
| `fieldType` | `FieldType` enum | See Field Types section |
| `isRequired` | boolean | Default false |
| `shape` | JSONB? | Defines value structure |
| `configShape` | JSONB? | Type-specific config (options, rules) |
| `protection` | enum? | Template protection level |

### `CrmObject`
One record of a `CrmObjectType`.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `objectType` | `CrmObjectType` | Parent type |
| `displayName` | string | Human-readable identifier |
| `fieldValues` | JSONB | `{ [apiName]: value }` |
| `createdAt` | Date | |
| `updatedAt` | Date | |

### `CrmAssociationType`
Defines a named relationship between two `CrmObjectType`s.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `sourceObjectType` | `CrmObjectType` | FK (delete restricted) |
| `targetObjectType` | `CrmObjectType` | FK (delete restricted) |
| `name` | string | Forward label ("has many") |
| `apiName` | string | snake_case, company-unique |
| `sourceCardinality` | `ONE \| MANY` | Max links from source side |
| `targetCardinality` | `ONE \| MANY` | Max links from target side |
| `isBidirectional` | boolean | Auto-creates reverse link |
| `reverseName` | string? | Reverse label ("belongs to") |

### `CrmObjectAssociation`
One concrete link between two `CrmObject` records.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `sourceObject` | `CrmObject` | Source record |
| `targetObject` | `CrmObject` | Target record |
| `type` | `CrmAssociationType` | The relationship definition |
| `reverseOf` | `CrmObjectAssociation`? | Mirrors reverse link |
| `metadata` | JSONB? | Optional extra data |
| Unique | `(company, type, source, target)` | No duplicate links |

---

## Field Types

### Supported Types

| Enum value | Label | Usable in formula | Formula capable | Protected |
|-----------|-------|:-----------------:|:---------------:|:---------:|
| `string` | Text | ✓ | ✓ | |
| `number` | Number | ✓ | ✓ | |
| `boolean` | Checkbox | ✓ | | |
| `date` | Date | ✓ | ✓ | |
| `datetime` | Date & Time | ✓ | ✓ | |
| `textarea` | Long Text | | ✓ | |
| `select` | Dropdown | ✓ | | |
| `multi_select` | Multi-select | ✓ | | |
| `currency` | Currency | ✓ | ✓ | |
| `url` | URL | | | |
| `email` | Email | | | |
| `phone` | Phone | | | |
| `address` | Address | | | |
| `json` | JSON | | | |
| `formula` | Formula | ✓ | ✓ | |
| `protected_email` | Protected Email | | | ✓ |
| `protected_phone` | Protected Phone | | | ✓ |
| `protected_address` | Protected Address | | | ✓ |

### Field Type Registry

`GET /crm-object-field/definition` (public, no auth) returns the full registry. Each entry includes:

```json
{
  "string": {
    "label": "Text",
    "shape": { "value": { "type": "string", "optional": true } },
    "configShape": null,
    "actions": [],
    "isFormulaCapable": true,
    "isUsableInFormula": true,
    "isProtected": false
  }
}
```

Pass `?type=select` to get a single entry.

### Structured Field Shapes

Some types store structured values in `fieldValues`:

**`address`**
```json
{ "street": "...", "city": "...", "state": "...", "zip": "...", "country": "..." }
```

**`phone`**
```json
{ "countryCode": "+1", "number": "5551234567" }
```

**`select` / `multi_select`** — configShape carries the options list:
```json
{ "options": [{ "id": "opt_1", "label": "Open", "value": "open" }] }
```

**`protected_*`** — value shape stores only a reference ID:
```json
{ "protectedValueId": "uuid" }
```

---

## Formula Field System

### How it Works

Formula fields compute a value from other fields on the same object. The formula is stored as an **expression tree** (not an infix string).

```
Field definition (CrmObjectField)
  └── configShape
        ├── category: "string" | "math" | "date"
        ├── expressionTree: { ... }     ← stored tree
        └── dependsOnFields: ["first_name", "last_name"]
```

### Expression Tree Shape

```json
{ "field": "api_name" }            // reference a field
{ "literal": 42 }                  // inline value
{ "function": "JOIN", "args": [...] }  // function call
```

Example: concatenate first + last name separated by a space:
```json
{
  "function": "JOIN",
  "args": [
    { "literal": " " },
    { "field": "first_name" },
    { "field": "last_name" }
  ]
}
```

### Formula Endpoints (all public except `context` and `normalize`)

| Endpoint | Purpose |
|----------|---------|
| `GET /formula/categories` | Available categories: `math`, `string`, `date` |
| `GET /formula/category-to-functions` | Category → list of function names |
| `GET /formula/functions` | Full function metadata (signature, return type) |
| `GET /formula/context/:objectTypeId` | Fields + type hints for this object type |
| `POST /formula/normalize` | Validate & normalize a tree (returns `{ valid, errors, normalized }`) |
| `PATCH /:id/formula` | Save validated formula config to a field |

### Frontend Formula Workflow

1. Fetch context → know which fields are usable
2. User builds expression tree in UI
3. `POST /formula/normalize` → validate before saving
4. On success, `PATCH /:id/formula` to persist

---

## Association System

### Cardinality

| sourceCardinality | targetCardinality | Meaning |
|:-:|:-:|---------|
| MANY | MANY | Each record can link to unlimited others in both directions |
| ONE | MANY | Each source links to at most 1 target; target can be linked from many |
| MANY | ONE | Each source can link to many targets; target links to at most 1 source |
| ONE | ONE | Strict 1-to-1 |

Cardinality is **enforced at write time**. Attempting to add a second link that violates `ONE` throws a `409 Conflict`.

Tightening an existing `MANY → ONE` constraint is **blocked** if existing data would violate it.

### Bidirectional Associations

When `isBidirectional = true`, creating an association `A → B` automatically creates the reverse `B → A` in the same transaction, linked via `reverseOf`. Deleting either half deletes both.

### Viewing Associations on an Object

`GET /crm-object/:id/associations` returns all associations grouped by type + role:

```json
{
  "groups": [
    {
      "typeId": "...",
      "typeName": "Has contacts",
      "typeApiName": "has_contacts",
      "role": "source",
      "linkedObjects": [ { "id": "...", "displayName": "...", "fieldValues": {} } ],
      "total": 12
    }
  ]
}
```

`linkedObjects` is capped at 5 for previews; `total` gives the real count.

---

## CRM Object CRUD

### Creating Objects

`POST /crm-object`

```json
{
  "objectTypeId": "uuid",
  "displayName": "Acme Corp",
  "fieldValues": {
    "email": { "value": "acme@example.com" },
    "employees": { "value": 200 }
  }
}
```

Field values are validated against the type's field definitions:
- Required fields must be present on create
- Values must match the field's `shape`
- Formula fields are **read-only** (ignored on create/update, computed on read)
- Protected field values are split off and stored encrypted separately

### Updating Objects

`PATCH /crm-object/:id` — update `displayName` and/or `fieldValues` (partial update, unset keys untouched).

`PATCH /crm-object/:id/field/:apiName` — update a single field by its API name.

### Bulk Operations

All entity types support bulk variants:

| Operation | Endpoint |
|-----------|---------|
| Bulk create objects | `POST /crm-object/bulk` |
| Bulk update objects | `PATCH /crm-object/bulk` |
| Bulk delete objects | `DELETE /crm-object/bulk` |
| Bulk create associations | `POST /crm-object-association/bulk` |
| Bulk delete associations | `DELETE /crm-object-association/bulk` |

Bulk responses report per-item success/failure without aborting the whole batch:

```json
{
  "total": 3,
  "successful": 2,
  "failed": 1,
  "results": [
    { "index": 0, "success": true, "id": "uuid" },
    { "index": 1, "success": true, "id": "uuid" },
    { "index": 2, "success": false, "error": "Field 'email' is required" }
  ]
}
```

### Full Object Response

`GET /crm-object/:id/full` returns the object enriched with:
- Field metadata (label, type, required flag) alongside each value
- Association summaries (grouped, same shape as `/associations`)

---

## Protected Fields

Protected fields (`protected_phone`, `protected_email`, `protected_address`) store their actual value encrypted in a separate `ProtectedValue` entity. The `fieldValues` JSON only holds `{ protectedValueId: "uuid" }`.

### Accessing Protected Values

Use the **Protected Actions** controller:

| Endpoint | Purpose |
|---------|---------|
| `POST /client/protected-actions/call` | Initiate a call to a protected phone |
| `POST /client/protected-actions/sms` | Send SMS to a protected phone |
| `POST /client/protected-actions/email` | Send email to a protected email |

The `configShape` of a protected field controls which actions are allowed (`allowedActions`), how the value is masked in the UI (`maskingStyle`), and whether the full value can be revealed (`revealable`).

---

## Import Feature

Bulk data ingestion from CSV into any combination of CRM object types with optional association creation.

### Flow Overview

```
1. Upload       Upload CSV to S3 via presigned URL
2. Session      Create import session
3. Configure    Map columns → fields, set match rules, define link rules
4. Validate     Server confirms mapping is complete and valid
5. Parse        Server reads rows from S3 into staging records
6. Execute      Start background import job
7. Monitor      Poll job status + retrieve per-row results
```

### Key Concepts

**ImportObjectMap** — tells the importer "for each row, create/update/skip a record of this object type, matching by these fields."

**ImportFieldMap** — maps a CSV column (by index) to a CRM field. Supports default values and transform rules.

**ImportDraftField** — create a brand-new field as part of the import (no pre-creation needed).

**ImportLinkRule** — creates associations between object types being imported in the same session.

**ImportDraftAssociationType** — define a new association type on the fly during import.

### Match Behaviors

| Behavior | Effect |
|----------|--------|
| `CREATE` | Always insert a new record |
| `UPDATE` | Match by `matchFields`; update if found, insert if not |
| `SKIP` | Match by `matchFields`; skip the row if a match exists |

---

## Endpoint Summary

### Schema Endpoints

**CRM Object Types** — `GET|POST /crm-object-type`, `GET|PATCH|DELETE /crm-object-type/:id`

**CRM Object Fields** — `GET|POST /crm-object-field`, `PATCH|DELETE /crm-object-field/:id`

**CRM Association Types** — `GET|POST /crm-association-type`, `GET|PATCH|DELETE /crm-association-type/:id`

All schema endpoints are behind `UserAuthGuard`. `GET /crm-object-field/definition` and all `/formula/` helper endpoints are **public** (no auth) to power frontend builders without requiring login.

### Data Endpoints

**CRM Objects** — `GET|POST /crm-object`, `GET|PATCH|DELETE /crm-object/:id`

**Associations** — `GET|POST /crm-object-association`, `DELETE /crm-object-association/:id`

**Protected Actions** — `POST /client/protected-actions/{call,sms,email}`

**Import** — `GET|POST /object-import/*` (multi-step, see Import section)

### Common Query Parameters

| Param | Used by | Description |
|-------|---------|-------------|
| `limit` | all lists | Page size (required) |
| `offset` | all lists | Page offset (required) |
| `searchQuery` | most lists | Optional free-text filter |
| `objectTypeId` | objects, assoc types | Scope to specific type |
| `associationCheck` | object types | Exclude types already associated with given id |

### `apiName` Availability

Every schema type exposes `GET /:type/api-name/:value → boolean` to pre-check availability before creation. Also validates snake_case format.

---

## Error Patterns

Schema creation and updates throw `BadRequestException` / `ConflictException` with a structured body:

```json
{ "code": "ASSOCIATION_ALREADY_EXISTS", "message": "..." }
```

Bulk operations never throw — failures are captured per-item in the response.

---

## Swagger

`ObjectRelatedModule` is included in the client Swagger at `/client` (UI) and `/client/api-json`.
