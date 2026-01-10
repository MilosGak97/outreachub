# CRM Objects - Enhanced Testing Checklist

> Comprehensive test cases for CRM object instance and association endpoints.
> Each checkbox should be verified before considering an endpoint complete.

---

## Table of Contents

1. [Authentication & Authorization](#1-authentication--authorization)
2. [CRM Objects CRUD](#2-crm-objects-crud)
3. [Search, Filtering & Sorting](#3-search-filtering--sorting)
4. [Field Validation Matrix](#4-field-validation-matrix)
5. [Bulk Operations](#5-bulk-operations)
6. [Object Associations (via /crm-object)](#6-object-associations-via-crm-object)
7. [CRM Object Associations CRUD](#7-crm-object-associations-crud)
8. [Data Integrity & Cascade](#8-data-integrity--cascade)
9. [Multi-Tenancy & Security](#9-multi-tenancy--security)
10. [Concurrency & Race Conditions](#10-concurrency--race-conditions)
11. [Performance & Limits](#11-performance--limits)

---

## 1. Authentication & Authorization

> These tests apply to ALL endpoints in this document

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
| Client user from another company | ANY | 404 `Object not found` or 403 | ⬜ |
| Client user without access to object type | ANY | 404 `Object type not found` | ⬜ |

---

## 2. CRM Objects CRUD

### 2.1 POST /crm-object (Create)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Create with displayName only | 201 + object data | ⬜ |
| Create with fieldValues | 201 + persisted fieldValues | ⬜ |
| Unknown field in fieldValues | 201 + unknown field ignored | ⬜ |
| Required fields provided | 201 Success | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing objectTypeId | 400 `Validation failed` | ⬜ |
| Invalid objectTypeId | 400 `Validation failed` | ⬜ |
| Non-existent objectTypeId | 404 `Object type with ID ... not found` | ⬜ |
| Missing displayName | 400 `Validation failed` | ⬜ |
| displayName > 255 chars | 400 `Validation failed` | ⬜ |
| Missing required fieldValues on create | 400 `Required field ... is missing` | ⬜ |
| Invalid fieldValues type (not object) | 400 `Validation failed` | ⬜ |

---

### 2.2 POST /crm-object/bulk (Bulk Create)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Create 1 object | 201 + { total: 1, successful: 1 } | ⬜ |
| Create 10 objects | 201 + 10 successes | ⬜ |
| Mixed valid/invalid items | 201 + per-item results, partial success | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing objectTypeId | 400 `Validation failed` | ⬜ |
| objects array > 100 | 400 `Maximum 100 objects per bulk create` | ⬜ |
| Empty objects array | 400 `Validation failed` or 200 with total=0 | ⬜ |
| Item missing displayName | 400 `Validation failed` | ⬜ |

---

### 2.3 GET /crm-object (List)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| List with limit=20 offset=0 | 200 + paginated result | ⬜ |
| List with searchQuery | Filtered by displayName (case-insensitive) | ⬜ |
| Sort by displayName ASC/DESC | Sorted properly | ⬜ |
| Sort by createdAt/updatedAt | Sorted properly | ⬜ |
| Sort by field apiName | Sorted by JSONB field value | ⬜ |
| Empty result | 200 + empty array, totalRecords=0 | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing objectTypeId | 400 `Validation failed` | ⬜ |
| Invalid objectTypeId | 400 `Validation failed` | ⬜ |
| Non-existent objectTypeId | 404 `Object type ... not found` | ⬜ |
| limit=0 | 400 `Validation failed` | ⬜ |
| limit=101 | 400 `Validation failed` | ⬜ |
| offset=-1 | 400 `Validation failed` | ⬜ |
| sortBy SQL injection attempt | 400 `Validation failed` | ⬜ |

---

### 2.4 POST /crm-object/search (Advanced Search)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Search with no filters | 200 + paginated result | ⬜ |
| Search with filters (AND) | 200 + filtered results | ⬜ |
| Search with filters (OR) | 200 + filtered results | ⬜ |
| Search with default limit/offset | 200 + defaults (20/0) | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing objectTypeId | 400 `Validation failed` | ⬜ |
| Invalid objectTypeId | 400 `Validation failed` | ⬜ |
| Non-existent objectTypeId | 404 `Object type ... not found` | ⬜ |
| Invalid operator value | 400 `Validation failed` | ⬜ |
| Invalid filter payload | 400 `Validation failed` | ⬜ |
| Numeric operator with non-numeric value | 400 `Invalid filter value` | ⬜ |

---

### 2.5 GET /crm-object/:id (Get by ID)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid UUID exists | 200 + object data | ⬜ |
| Field values present | Correct values returned | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent UUID | 404 `Object with ID ... not found` | ⬜ |
| Invalid UUID format | 400 `Validation failed` | ⬜ |

---

### 2.6 GET /crm-object/:id/full (Get Full Details)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid UUID exists | 200 + object + fields metadata + associations | ⬜ |
| Fields include shape/configShape | Correct metadata present | ⬜ |
| Associations include counts + previews | Up to 5 previews per group | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent UUID | 404 `Object with ID ... not found` | ⬜ |
| Invalid UUID format | 400 `Validation failed` | ⬜ |

---

### 2.7 PATCH /crm-object/:id (Update)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Update displayName only | 200 + updated displayName | ⬜ |
| Update fieldValues only | 200 + merged fieldValues | ⬜ |
| Set field to null | 200 + field removed | ⬜ |
| Unknown field in update | 200 + unknown field ignored | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent UUID | 404 `Object with ID ... not found` | ⬜ |
| Invalid UUID format | 400 `Validation failed` | ⬜ |
| Invalid displayName length | 400 `Validation failed` | ⬜ |
| Invalid field value | 400 field validation error | ⬜ |

---

### 2.8 PATCH /crm-object/:id/field/:apiName (Update Single Field)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Update a valid field | 200 + updated field in response | ⬜ |
| Set field to null | 200 + field removed | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent UUID | 404 `Object with ID ... not found` | ⬜ |
| Invalid UUID format | 400 `Validation failed` | ⬜ |
| Invalid field value | 400 field validation error | ⬜ |

---

### 2.9 PATCH /crm-object/bulk (Bulk Update)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Update 1 object | 200 + { total: 1, successful: 1 } | ⬜ |
| Update 10 objects | 200 + mixed results | ⬜ |
| Mixed valid/invalid items | 200 + per-item success/failure | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| objects array > 100 | 400 `Maximum 100 objects per bulk update` | ⬜ |
| Item missing id | 400 `Validation failed` | ⬜ |
| Invalid field value in one item | 200 + failure for that item | ⬜ |

---

### 2.10 DELETE /crm-object/:id (Delete)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete existing object | 200 `Object deleted successfully` | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent UUID | 404 `Object with ID ... not found` | ⬜ |
| Invalid UUID format | 400 `Validation failed` | ⬜ |

---

### 2.11 DELETE /crm-object/bulk (Bulk Delete)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete 1 object | 200 + success | ⬜ |
| Delete 10 objects | 200 + mixed results | ⬜ |
| Mixed valid/invalid ids | 200 + per-item success/failure | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| ids array > 100 | 400 `Maximum 100 objects per bulk delete` | ⬜ |
| Invalid UUID in ids | 400 `Validation failed` | ⬜ |

---

## 3. Search, Filtering & Sorting

### 3.1 Field Filter Operators (POST /crm-object/search)

| Test Case | Operator | Expected | Status |
|-----------|----------|----------|--------|
| Exact match string | eq | Matching records | ⬜ |
| Not equals | neq | Excludes matching records | ⬜ |
| Greater than | gt | Numeric comparison works | ⬜ |
| Greater or equal | gte | Numeric comparison works | ⬜ |
| Less than | lt | Numeric comparison works | ⬜ |
| Less or equal | lte | Numeric comparison works | ⬜ |
| Contains | contains | Case-insensitive partial match | ⬜ |
| Starts with | startsWith | Prefix match | ⬜ |
| Ends with | endsWith | Suffix match | ⬜ |
| IN (array) | in | Matches any value in array | ⬜ |
| IN (scalar) | in | Coerces to array, works | ⬜ |
| IS NULL | isNull | Matches null or empty string | ⬜ |
| IS NOT NULL | isNotNull | Excludes null/empty | ⬜ |

### 3.2 Filter Logic

| Test Case | Expected | Status |
|-----------|----------|--------|
| Two filters + AND | Both conditions apply | ⬜ |
| Two filters + OR | Either condition applies | ⬜ |
| Empty filters array | Same as no filters | ⬜ |
| Unknown field in filter | No crash, returns empty or ignored | ⬜ |

### 3.3 Sorting

| Test Case | Expected | Status |
|-----------|----------|--------|
| sortBy=displayName | Lexicographic order | ⬜ |
| sortBy=createdAt | Chronological order | ⬜ |
| sortBy=updatedAt | Chronological order | ⬜ |
| sortBy=<field apiName> | Order by JSONB field values | ⬜ |
| sortBy unknown | No crash, still returns data | ⬜ |

---

## 4. Field Validation Matrix

> These apply to create/update (single and bulk). “Valid” cases should succeed; invalid cases should return 400 with a clear error.

### 4.1 STRING / TEXTAREA
| Test Case | Expected | Status |
|-----------|----------|--------|
| String value | Success | ⬜ |
| Non-string value | 400 `Value must be a string` | ⬜ |

### 4.2 NUMBER
| Test Case | Expected | Status |
|-----------|----------|--------|
| Number value | Success | ⬜ |
| Numeric string | Success + sanitized number | ⬜ |
| Non-numeric string | 400 `Value must be a number` | ⬜ |
| Value < min (configShape) | 400 `Value must be at least ...` | ⬜ |
| Value > max (configShape) | 400 `Value must be at most ...` | ⬜ |

### 4.3 BOOLEAN
| Test Case | Expected | Status |
|-----------|----------|--------|
| true/false | Success | ⬜ |
| "true"/"false" | Success + sanitized boolean | ⬜ |
| 1/0 | Success + sanitized boolean | ⬜ |
| Invalid value | 400 `Value must be a boolean` | ⬜ |

### 4.4 DATE / DATETIME
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid ISO date | Success + normalized date | ⬜ |
| Valid ISO datetime | Success + normalized datetime | ⬜ |
| Invalid date string | 400 `Invalid date format` | ⬜ |
| Non-string value | 400 `Date/DateTime must be a string in ISO format` | ⬜ |

### 4.5 EMAIL
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid email | Success + lowercased | ⬜ |
| Invalid email | 400 `Invalid email format` | ⬜ |

### 4.6 URL
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid URL | Success | ⬜ |
| Invalid URL | 400 `Invalid URL format` | ⬜ |

### 4.7 PHONE
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid object { code, number } | Success | ⬜ |
| Missing code or number | 400 `Invalid phone structure` | ⬜ |
| Non-object value | 400 `Phone must be an object with code and number` | ⬜ |

### 4.8 SELECT / MULTI_SELECT
| Test Case | Expected | Status |
|-----------|----------|--------|
| Select string value | Success + { value } | ⬜ |
| Select object { value } | Success + normalized | ⬜ |
| Select invalid option | 400 `Invalid option` | ⬜ |
| Multi-select array of strings | Success + normalized array | ⬜ |
| Multi-select invalid item | 400 `Each multi-select item must be...` | ⬜ |
| Multi-select invalid option | 400 `Invalid option` | ⬜ |

### 4.9 CURRENCY
| Test Case | Expected | Status |
|-----------|----------|--------|
| Currency object { amount, currency } | Success | ⬜ |
| Number only | Success + { amount, currency: USD } | ⬜ |
| Invalid amount | 400 `Currency amount must be a number` | ⬜ |

### 4.10 JSON
| Test Case | Expected | Status |
|-----------|----------|--------|
| JSON object | Success | ⬜ |
| JSON string | Success + parsed object | ⬜ |
| Invalid JSON string | 400 `Invalid JSON format` | ⬜ |

### 4.11 ADDRESS
| Test Case | Expected | Status |
|-----------|----------|--------|
| Object with address fields | Success + sanitized strings | ⬜ |
| Non-object value | 400 `Address must be an object` | ⬜ |

### 4.12 FORMULA
| Test Case | Expected | Status |
|-----------|----------|--------|
| Set formula field value | 400 `Formula fields cannot be set directly` | ⬜ |

### 4.13 PROTECTED_* (PHONE/EMAIL/ADDRESS)
| Test Case | Expected | Status |
|-----------|----------|--------|
| Protected email valid string | Success | ⬜ |
| Protected phone valid object { code, number } | Success | ⬜ |
| Protected address valid object | Success | ⬜ |
| Invalid protected field value | 400 validation error | ⬜ |

---

## 5. Bulk Operations

### 5.1 Bulk Create (POST /crm-object/bulk)
| Test Case | Expected | Status |
|-----------|----------|--------|
| All valid items | successful = total | ⬜ |
| Some invalid items | failed count > 0, successes preserved | ⬜ |
| Duplicate displayName | Allowed | ⬜ |

### 5.2 Bulk Update (PATCH /crm-object/bulk)
| Test Case | Expected | Status |
|-----------|----------|--------|
| Update existing IDs only | successes only | ⬜ |
| Mixed valid/invalid IDs | Per-item failure | ⬜ |
| Update with empty fieldValues | No change | ⬜ |

### 5.3 Bulk Delete (DELETE /crm-object/bulk)
| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete existing IDs | Success for each | ⬜ |
| Mixed existing/missing | Per-item failure | ⬜ |
| Empty ids array | 200 with total=0 | ⬜ |

---

## 6. Object Associations (via /crm-object)

### 6.1 GET /crm-object/:id/associations
| Test Case | Expected | Status |
|-----------|----------|--------|
| Object with associations | Grouped by type + role | ⬜ |
| Object with no associations | Empty groups | ⬜ |
| Non-existent object | 404 `Object with ID ... not found` | ⬜ |

### 6.2 GET /crm-object/:id/associations/:typeId
| Test Case | Expected | Status |
|-----------|----------|--------|
| Filter by typeId | Only that association type | ⬜ |
| Non-existent object | 404 `Object with ID ... not found` | ⬜ |
| Invalid typeId | 400 `Validation failed` | ⬜ |

---

## 7. CRM Object Associations CRUD

### 7.1 POST /crm-object-association (Create)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Create association (one-to-many) | 201 + association data | ⬜ |
| Create association (many-to-many) | 201 + association data | ⬜ |
| Bidirectional type | 201 + reverse link created | ⬜ |
| Create with metadata | 201 + metadata saved | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing typeId/sourceObjectId/targetObjectId | 400 `Validation failed` | ⬜ |
| Invalid UUID format | 400 `Validation failed` | ⬜ |
| Non-existent typeId | 404 `Association type ... not found` | ⬜ |
| Non-existent object | 404 `Object with ID ... not found` | ⬜ |
| Self-association | 400 code=SELF_ASSOCIATION_NOT_ALLOWED | ⬜ |
| Invalid object type for association | 400 code=INVALID_OBJECT_TYPE_FOR_ASSOCIATION | ⬜ |
| Duplicate association | 400 code=ASSOCIATION_ALREADY_EXISTS | ⬜ |
| Cardinality violation (ONE) | 400 code=CARDINALITY_VIOLATION | ⬜ |

---

### 7.2 POST /crm-object-association/bulk (Bulk Create)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Create 1 association | 201 + success | ⬜ |
| Create 10 associations | 201 + per-item results | ⬜ |
| Mixed valid/invalid items | 201 + per-item failures | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing sourceObjectId | 400 `Validation failed` | ⬜ |
| associations > 50 | 400 `Maximum 50 associations per bulk create` | ⬜ |
| Invalid association item | 201 + failure for that item | ⬜ |

---

### 7.3 GET /crm-object-association (List)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| List with limit/offset | 200 + paginated result | ⬜ |
| Filter by sourceObjectId | Only source matches | ⬜ |
| Filter by targetObjectId | Only target matches | ⬜ |
| Filter by typeId | Only that type | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Missing limit/offset | 400 `Validation failed` | ⬜ |
| limit=0 | 400 `Validation failed` | ⬜ |
| offset=-1 | 400 `Validation failed` | ⬜ |

---

### 7.4 GET /crm-object-association/:id (Get by ID)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Valid UUID exists | 200 + association data | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent UUID | 404 `Association with ID ... not found` | ⬜ |
| Invalid UUID format | 400 `Validation failed` | ⬜ |

---

### 7.5 DELETE /crm-object-association/:id (Delete)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete association | 200 `Association deleted successfully` | ⬜ |
| Delete bidirectional association | Both directions removed | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| Non-existent UUID | 404 `Association with ID ... not found` | ⬜ |
| Invalid UUID format | 400 `Validation failed` | ⬜ |

---

### 7.6 DELETE /crm-object-association/bulk (Bulk Delete)

#### Happy Path
| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete 1 association | 200 + success | ⬜ |
| Delete multiple associations | 200 + per-item results | ⬜ |
| Mixed valid/invalid IDs | 200 + per-item failures | ⬜ |

#### Error Cases
| Test Case | Expected Error | Status |
|-----------|----------------|--------|
| associationIds > 50 | 400 `Maximum 50 associations per bulk delete` | ⬜ |
| Invalid UUID in array | 400 `Validation failed` | ⬜ |

---

## 8. Data Integrity & Cascade

| Test Case | Expected | Status |
|-----------|----------|--------|
| Delete object with associations | Associations removed (no orphans) | ⬜ |
| Delete association, reverse removed | No dangling reverseOf links | ⬜ |
| Delete object type with objects | Blocked or cascades per schema | ⬜ |

---

## 9. Multi-Tenancy & Security

| Test Case | Expected | Status |
|-----------|----------|--------|
| Access object from another company | 404 `Object with ID ... not found` | ⬜ |
| Search objects of another company | Empty result | ⬜ |
| Create association across companies | 404 `Object not found` | ⬜ |

---

## 10. Concurrency & Race Conditions

| Test Case | Expected | Status |
|-----------|----------|--------|
| Two clients update same object | Last write wins or conflict | ⬜ |
| Concurrent association create (same pair) | One succeeds, other fails duplicate | ⬜ |
| Bulk update + delete same object | Predictable failure for one | ⬜ |

---

## 11. Performance & Limits

| Test Case | Expected | Status |
|-----------|----------|--------|
| List with 10k objects | Response < 2s | ⬜ |
| Search with 3 filters | Response < 2s | ⬜ |
| Bulk create 100 objects | 201 + summary | ⬜ |
| Bulk update 100 objects | 200 + summary | ⬜ |
| Bulk delete 100 objects | 200 + summary | ⬜ |
