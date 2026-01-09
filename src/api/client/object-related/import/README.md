# CSV Import Module Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Import Flow](#import-flow)
5. [Existing Endpoints](#existing-endpoints)
6. [New Endpoints to Implement](#new-endpoints-to-implement)
7. [Transform Rules](#transform-rules)
8. [Validation & Required Fields](#validation--required-fields)
9. [Frontend Integration Guide](#frontend-integration-guide)

---

## Overview

The CSV Import Module enables users to import data from CSV files into the CRM system. It supports:

- **Multiple Object Types per File**: A single CSV can create/update multiple CRM object types (e.g., Contacts + Companies)
- **Draft Fields**: Create new fields on-the-fly during import (fields that don't exist yet)
- **Draft Association Types**: Create new relationship types between objects during import
- **Deduplication**: Match existing records by configurable fields to update instead of duplicate
- **Relationships/Associations**: Link imported objects together (e.g., Contact belongs to Company)
- **Data Transformation**: Transform CSV values before import (uppercase, lowercase, etc.)
- **Default Values**: Provide fallback values when CSV cells are empty

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           IMPORT FLOW                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  1. UPLOAD PHASE                                                         │
│     ┌──────────┐    ┌──────────┐    ┌──────────┐                        │
│     │ Get      │───▶│ Upload   │───▶│ Create   │                        │
│     │ Presigned│    │ to S3    │    │ File     │                        │
│     │ URL      │    │          │    │ Metadata │                        │
│     └──────────┘    └──────────┘    └──────────┘                        │
│                                           │                              │
│  2. SESSION PHASE                         ▼                              │
│     ┌──────────────────────────────────────────┐                        │
│     │           Create Import Session           │                        │
│     │         (links file to session)           │                        │
│     └──────────────────────────────────────────┘                        │
│                          │                                               │
│  3. MAPPING PHASE        ▼                                               │
│     ┌────────────────────────────────────────────────────────────┐      │
│     │                    Configure Mappings                       │      │
│     │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │      │
│     │  │Object Maps  │  │ Field Maps  │  │ Link Rules          │ │      │
│     │  │(which CRM   │  │ (CSV col →  │  │ (associations       │ │      │
│     │  │ objects)    │  │  CRM field) │  │  between objects)   │ │      │
│     │  └─────────────┘  └─────────────┘  └─────────────────────┘ │      │
│     │                                                             │      │
│     │  ┌─────────────┐  ┌─────────────────────────────────────┐  │      │
│     │  │Draft Fields │  │ Draft Association Types             │  │      │
│     │  │(new fields  │  │ (new relationship types to create)  │  │      │
│     │  │ to create)  │  │                                     │  │      │
│     │  └─────────────┘  └─────────────────────────────────────┘  │      │
│     └────────────────────────────────────────────────────────────┘      │
│                          │                                               │
│  4. VALIDATION PHASE     ▼                                               │
│     ┌──────────────────────────────────────────┐                        │
│     │          Validate Session                 │                        │
│     │    (check all mappings are complete)      │                        │
│     └──────────────────────────────────────────┘                        │
│                          │                                               │
│  5. PARSING PHASE        ▼                                               │
│     ┌──────────────────────────────────────────┐                        │
│     │       Parse Rows from Storage             │                        │
│     │   (read CSV, create ImportRow records)    │                        │
│     └──────────────────────────────────────────┘                        │
│                          │                                               │
│  6. EXECUTION PHASE      ▼                                               │
│     ┌──────────────────────────────────────────┐                        │
│     │           Create Import Job               │                        │
│     │  (background worker processes rows)       │                        │
│     └──────────────────────────────────────────┘                        │
│                          │                                               │
│  7. RESULTS PHASE        ▼                                               │
│     ┌──────────────────────────────────────────┐                        │
│     │         Poll Job Status / Get Results     │                        │
│     │   (created, updated, skipped, failed)     │                        │
│     └──────────────────────────────────────────┘                        │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Core Entities

#### ImportFile
Stores metadata about the uploaded CSV file.
```typescript
{
  id: string;              // UUID
  storageKey: string;      // S3 key where file is stored
  filename: string;        // Original filename
  mimeType: string;        // text/csv
  size: number;            // File size in bytes
  hasHeader: boolean;      // Does first row contain headers?
  columns: string[];       // Header names (or generated col_0, col_1, etc.)
  sampleRows: any[][];     // First N rows for preview
  rowCount: number;        // Total row count
}
```

#### ImportSession
A single import attempt/configuration.
```typescript
{
  id: string;
  file: ImportFile;
  createdBy: User;
  status: 'DRAFT' | 'VALIDATED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}
```

#### ImportObjectMap
Maps CSV data to a specific CRM Object Type. **One CSV can have multiple ObjectMaps.**
```typescript
{
  id: string;
  importSession: ImportSession;
  objectType: CrmObjectType;          // e.g., "Contact", "Company"
  matchBehavior: 'CREATE' | 'UPDATE' | 'SKIP';
}
```

**matchBehavior explained:**
- `CREATE`: Always create new records (no deduplication)
- `UPDATE`: If match found, update existing; otherwise create new
- `SKIP`: If match found, skip the row entirely

#### ImportMatchRule
Defines which fields to use for deduplication/matching.
```typescript
{
  id: string;
  objectMap: ImportObjectMap;
  matchFields: string[];  // Array of CrmObjectField IDs to match on
}
```

**Example:** Match on `email` field - if a Contact with same email exists, update it instead of creating duplicate.

#### ImportFieldMap
Maps a CSV column to a CRM field (or draft field).
```typescript
{
  id: string;
  objectMap: ImportObjectMap;
  sourceIndex: number;           // 0-based CSV column index
  targetField?: CrmObjectField;  // Existing CRM field
  draftField?: ImportDraftField; // OR new field to create
  defaultValue?: object;         // Value to use if CSV cell is empty
  transformRule?: object;        // Transformation to apply
}
```

#### ImportDraftField
A field that doesn't exist yet - will be created during import.
```typescript
{
  id: string;
  importSession: ImportSession;
  objectType: CrmObjectType;
  name: string;           // Display name
  apiName: string;        // API identifier (snake_case)
  fieldType: FieldType;   // STRING, NUMBER, EMAIL, etc.
  description?: string;
  isRequired?: boolean;
  shape?: object;         // Field type-specific schema
  configShape?: object;   // Additional config
}
```

#### ImportLinkRule
Defines how to create associations between imported objects.
```typescript
{
  id: string;
  importSession: ImportSession;
  mode: 'SKIP' | 'ROW' | 'FIELD';
  associationType?: CrmAssociationType;         // Existing association
  draftAssociationType?: ImportDraftAssociationType; // OR new association to create
  sourceObjectType: CrmObjectType;
  targetObjectType: CrmObjectType;
  sourceMatchField?: string;  // Field ID on source object to match
  targetMatchField?: string;  // Field ID on target object to match
}
```

**Link modes:**
- `SKIP`: Don't create any associations
- `ROW`: Objects in the same CSV row are linked together
- `FIELD`: Match objects by comparing field values

#### ImportDraftAssociationType
A new association type to create during import.
```typescript
{
  id: string;
  importSession: ImportSession;
  sourceObjectType: CrmObjectType;
  targetObjectType: CrmObjectType;
  sourceCardinality: 'ONE' | 'MANY';
  targetCardinality: 'ONE' | 'MANY';
  name: string;
  apiName: string;
  description?: string;
  isBidirectional: boolean;
  reverseName?: string;
}
```

#### ImportRow
A parsed row from the CSV.
```typescript
{
  id: string;
  importSession: ImportSession;
  rowIndex: number;        // Position in CSV (0-based, excludes header)
  rowId?: string;          // Optional unique identifier
  rawData: any[];          // Raw column values as array
  rowHash?: string;        // Hash for deduplication
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
}
```

#### ImportRowResult
Result of processing one row for one object type.
```typescript
{
  id: string;
  importSession: ImportSession;
  row: ImportRow;
  objectMap: ImportObjectMap;
  status: 'CREATED' | 'UPDATED' | 'SKIPPED' | 'FAILED';
  objectId?: string;       // ID of created/updated CRM object
  error?: object;          // Error details if failed
}
```

#### ImportJob
Background job that processes the import.
```typescript
{
  id: string;
  importSession: ImportSession;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt?: Date;
  finishedAt?: Date;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  linkedCount: number;
  errorReportKey?: string;  // S3 key to error report
}
```

---

## Import Flow

### Step 1: Upload CSV File

```typescript
// 1a. Get presigned URL for upload
POST /object-import/files/upload-url
Body: { filename: "contacts.csv", contentType: "text/csv" }
Response: {
  uploadUrl: "https://s3.amazonaws.com/...",
  storageKey: "imports/company-id/timestamp-uuid-contacts.csv",
  bucket: "my-bucket",
  contentType: "text/csv",
  expiresIn: 600
}

// 1b. Upload file directly to S3 using uploadUrl (frontend does this)

// 1c. Create file metadata
POST /object-import/files/metadata
Body: {
  storageKey: "imports/company-id/timestamp-uuid-contacts.csv",
  filename: "contacts.csv",
  mimeType: "text/csv",
  size: 12345,
  hasHeader: true,
  columns: ["name", "email", "company", "phone"],
  sampleRows: [["John Doe", "john@example.com", "Acme Inc", "555-1234"]],
  rowCount: 100
}
Response: { id: "file-uuid", ...fileMetadata }
```

### Step 2: Create Import Session

```typescript
POST /object-import/sessions
Body: { fileId: "file-uuid" }
Response: {
  id: "session-uuid",
  fileId: "file-uuid",
  status: "DRAFT",
  createdAt: "...",
  updatedAt: "..."
}
```

### Step 3: Configure Object Maps

Define which CRM objects this CSV will create/update.

```typescript
// Create/update object maps
PUT /object-import/sessions/{sessionId}/object-maps
Body: [
  {
    objectTypeId: "contact-type-uuid",
    matchBehavior: "UPDATE",
    matchFields: ["email-field-uuid"]  // Match on email to dedupe
  },
  {
    objectTypeId: "company-type-uuid",
    matchBehavior: "CREATE"  // Always create new companies
  }
]
Response: [
  { id: "object-map-1-uuid", objectTypeId: "...", matchBehavior: "UPDATE", matchFields: ["..."] },
  { id: "object-map-2-uuid", objectTypeId: "...", matchBehavior: "CREATE", matchFields: [] }
]
```

### Step 4: Configure Field Maps

Map CSV columns to CRM fields.

```typescript
PUT /object-import/sessions/{sessionId}/field-maps
Body: [
  // Map "name" column (index 0) to Contact.full_name field
  {
    objectMapId: "object-map-1-uuid",
    sourceIndex: 0,
    targetFieldId: "contact-fullname-field-uuid"
  },
  // Map "email" column (index 1) to Contact.email field
  {
    objectMapId: "object-map-1-uuid",
    sourceIndex: 1,
    targetFieldId: "contact-email-field-uuid"
  },
  // Map "company" column (index 2) to Company.name field
  {
    objectMapId: "object-map-2-uuid",
    sourceIndex: 2,
    targetFieldId: "company-name-field-uuid",
    transformRule: { type: "UPPERCASE" }  // Transform to uppercase
  },
  // Map "phone" column (index 3) to a NEW draft field
  {
    objectMapId: "object-map-1-uuid",
    sourceIndex: 3,
    draftFieldId: "draft-field-uuid",  // Reference to draft field
    defaultValue: { value: "N/A" }     // Default if empty
  }
]
```

### Step 5: Create Draft Fields (if needed)

When a CSV column should map to a field that doesn't exist yet:

```typescript
POST /object-import/sessions/{sessionId}/draft-fields
Body: {
  objectTypeId: "contact-type-uuid",
  name: "Phone Number",
  apiName: "phone_number",
  fieldType: "PHONE",
  description: "Contact's phone number",
  isRequired: false
}
Response: {
  id: "draft-field-uuid",
  objectTypeId: "...",
  name: "Phone Number",
  ...
}
```

### Step 6: Configure Link Rules (associations)

Link imported objects together:

```typescript
// First, check if association type already exists
GET /object-import/association-types?sourceObjectTypeId=contact-uuid&targetObjectTypeId=company-uuid
Response: [
  { id: "assoc-type-uuid", name: "Works At", apiName: "works_at", ... }
]

// If exists, create link rule using existing association
PUT /object-import/sessions/{sessionId}/link-rules
Body: [
  {
    mode: "ROW",  // Link objects from same CSV row
    associationTypeId: "assoc-type-uuid",
    sourceObjectTypeId: "contact-type-uuid",
    targetObjectTypeId: "company-type-uuid"
  }
]

// OR if you need a new association type:
POST /object-import/sessions/{sessionId}/draft-association-types
Body: {
  sourceObjectTypeId: "contact-type-uuid",
  targetObjectTypeId: "company-type-uuid",
  sourceCardinality: "MANY",
  targetCardinality: "ONE",
  name: "Works At",
  apiName: "works_at",
  isBidirectional: true,
  reverseName: "Employs"
}
```

### Step 7: Validate Session

```typescript
POST /object-import/sessions/{sessionId}/validate
Response: {
  id: "session-uuid",
  status: "VALIDATED",  // or still "DRAFT" if validation fails
  ...
}
```

### Step 8: Parse Rows

```typescript
POST /object-import/sessions/{sessionId}/rows
Response: {
  rowCount: 100,
  parsed: 100
}
```

### Step 9: Execute Import

```typescript
POST /object-import/sessions/{sessionId}/jobs
Response: {
  id: "job-uuid",
  status: "QUEUED",
  createdCount: 0,
  updatedCount: 0,
  skippedCount: 0,
  linkedCount: 0
}
```

### Step 10: Monitor Progress & Get Results

```typescript
// Poll job status
GET /object-import/sessions/{sessionId}/jobs/{jobId}
Response: {
  id: "job-uuid",
  status: "COMPLETED",  // QUEUED → RUNNING → COMPLETED/FAILED
  startedAt: "...",
  finishedAt: "...",
  createdCount: 85,
  updatedCount: 10,
  skippedCount: 3,
  linkedCount: 95,
  errorReportKey: null  // or S3 key if errors
}

// Get detailed results
GET /object-import/sessions/{sessionId}/results?page=1&limit=20&status=FAILED
Response: {
  items: [
    {
      id: "result-uuid",
      rowIndex: 15,
      objectMapId: "...",
      status: "FAILED",
      error: { message: "Invalid email format", field: "email" }
    }
  ],
  total: 2,
  page: 1,
  limit: 20
}
```

---

## Existing Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/object-import/health` | Health check |
| POST | `/object-import/files/upload-url` | Get presigned S3 upload URL |
| POST | `/object-import/files/metadata` | Create file metadata record |
| POST | `/object-import/sessions` | Create import session |
| GET | `/object-import/association-types` | List association types for object pair |
| POST | `/object-import/sessions/:id/draft-fields` | Create draft field |
| PUT | `/object-import/sessions/:id/object-maps` | Upsert object maps and match rules |
| DELETE | `/object-import/sessions/:id/object-maps/:objectMapId/match-fields/:fieldId` | Remove match field |
| PUT | `/object-import/sessions/:id/field-maps` | Replace field maps |
| POST | `/object-import/sessions/:id/draft-association-types` | Create draft association type |
| PUT | `/object-import/sessions/:id/link-rules` | Add link rules |
| PUT | `/object-import/sessions/:id/link-rules/:ruleId` | Update link rule |
| DELETE | `/object-import/sessions/:id/link-rules/:ruleId` | Delete link rule |
| POST | `/object-import/sessions/:id/validate` | Validate session |
| POST | `/object-import/sessions/:id/rows` | Parse rows from storage |
| POST | `/object-import/sessions/:id/jobs` | Create import job |
| GET | `/object-import/sessions/:id/jobs/:jobId` | Get job status |
| GET | `/object-import/sessions/:id/results` | List import results |

---

## New Endpoints to Implement

### 1. GET /object-import/metadata

**Purpose:** Get system metadata for import configuration (available field types, transform rules, etc.)

**Implementation Notes:**
- No path params, no query params required
- Returns static/semi-static configuration data
- Cache-friendly (can be cached by frontend)

**Response DTO:**
```typescript
interface ImportMetadataResponseDto {
  fieldTypes: {
    type: string;        // e.g., "STRING", "NUMBER", "EMAIL"
    label: string;       // Human-readable: "Text", "Number", "Email"
    description: string; // "Single line text field"
    hasOptions: boolean; // true for SELECT, MULTI_SELECT
    supportsDefaultValue: boolean;
  }[];

  transformRules: {
    type: string;        // e.g., "UPPERCASE", "LOWERCASE", "CAPITALIZE"
    label: string;       // "Uppercase", "Lowercase", "Capitalize First Letter"
    description: string; // What it does
    example: {
      input: string;
      output: string;
    };
    applicableToTypes: string[];  // ["STRING", "EMAIL"] - which field types support this
  }[];

  matchBehaviors: {
    type: string;        // "CREATE", "UPDATE", "SKIP"
    label: string;
    description: string;
  }[];

  linkModes: {
    type: string;        // "SKIP", "ROW", "FIELD"
    label: string;
    description: string;
  }[];

  cardinalities: {
    type: string;        // "ONE", "MANY"
    label: string;
  }[];
}
```

---

### 2. GET /object-import/sessions

**Purpose:** List all import sessions for the current company.

**Query Parameters:**
```typescript
interface GetImportSessionsQueryDto {
  page?: number;          // Default: 1
  limit?: number;         // Default: 20, Max: 100
  status?: ImportSessionStatus;  // Filter by status
  sortBy?: 'createdAt' | 'updatedAt';  // Default: 'createdAt'
  sortOrder?: 'ASC' | 'DESC';          // Default: 'DESC'
}
```

**Response DTO:**
```typescript
interface ImportSessionListResponseDto {
  items: ImportSessionListItemDto[];
  total: number;
  page: number;
  limit: number;
}

interface ImportSessionListItemDto {
  id: string;
  status: ImportSessionStatus;
  createdAt: Date;
  updatedAt: Date;
  file: {
    id: string;
    filename: string;
    rowCount: number;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  // Summary stats (optional, may require join)
  objectMapsCount?: number;
}
```

---

### 3. GET /object-import/sessions/:id

**Purpose:** Get complete details of a single session including all mappings, columns, sample data.

**Response DTO:**
```typescript
interface ImportSessionDetailResponseDto {
  id: string;
  status: ImportSessionStatus;
  createdAt: Date;
  updatedAt: Date;

  file: {
    id: string;
    filename: string;
    storageKey: string;
    mimeType: string;
    size: number;
    hasHeader: boolean;
    rowCount: number;
    columns: ColumnInfoDto[];  // Enhanced column info
    sampleRows: any[][];       // First N rows
  };

  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  objectMaps: ImportObjectMapDetailDto[];
  fieldMaps: ImportFieldMapDto[];
  draftFields: ImportDraftFieldDto[];
  linkRules: ImportLinkRuleDto[];
  draftAssociationTypes: ImportDraftAssociationTypeDto[];

  // Validation state
  validation?: {
    isValid: boolean;
    errors: ValidationErrorDto[];
    warnings: ValidationWarningDto[];
  };
}

interface ColumnInfoDto {
  index: number;           // 0-based
  name: string;            // Header name or generated "Column 1"
  sampleValues: any[];     // Sample values from first N rows
  detectedType?: string;   // Auto-detected type hint: "string", "number", "email", "date"
  emptyCount?: number;     // How many empty values in sample
  uniqueCount?: number;    // How many unique values in sample
}

interface ImportObjectMapDetailDto {
  id: string;
  objectType: {
    id: string;
    name: string;
    apiName: string;
    pluralName: string;
  };
  matchBehavior: ImportMatchBehavior;
  matchFields: {
    id: string;
    name: string;
    apiName: string;
    fieldType: string;
  }[];
}

interface ValidationErrorDto {
  type: 'MISSING_REQUIRED_FIELD' | 'UNMAPPED_COLUMN' | 'INVALID_TRANSFORM' | 'DUPLICATE_MAPPING';
  message: string;
  objectMapId?: string;
  fieldId?: string;
  columnIndex?: number;
}

interface ValidationWarningDto {
  type: 'EMPTY_COLUMN' | 'TYPE_MISMATCH' | 'NO_MATCH_FIELDS';
  message: string;
  objectMapId?: string;
  columnIndex?: number;
}
```

---

### 4. GET /object-import/sessions/:id/object-maps/:objectMapId

**Purpose:** Get single object map with its field maps and available fields.

**Response DTO:**
```typescript
interface ImportObjectMapSingleResponseDto {
  id: string;
  objectType: {
    id: string;
    name: string;
    apiName: string;
    pluralName: string;
  };
  matchBehavior: ImportMatchBehavior;
  matchFields: CrmObjectFieldDto[];

  // All field maps for this object map
  fieldMaps: ImportFieldMapWithDetailsDto[];

  // Available CRM fields to map to (existing fields)
  availableFields: CrmObjectFieldDto[];

  // Draft fields created for this object type in this session
  draftFields: ImportDraftFieldDto[];
}

interface ImportFieldMapWithDetailsDto extends ImportFieldMapDto {
  columnName: string;      // From file columns
  columnSampleValues: any[];
  targetFieldDetails?: {
    id: string;
    name: string;
    apiName: string;
    fieldType: string;
    isRequired: boolean;
  };
  draftFieldDetails?: ImportDraftFieldDto;
}
```

---

### 5. GET /object-import/sessions/:id/draft-fields/:draftFieldId

**Purpose:** Get single draft field details.

**Response:** Return existing `ImportDraftFieldDto` with additional context:
```typescript
interface ImportDraftFieldDetailDto extends ImportDraftFieldDto {
  objectType: {
    id: string;
    name: string;
    apiName: string;
  };
  // Check if field name/apiName conflicts with existing fields
  conflicts?: {
    nameConflict?: boolean;
    apiNameConflict?: boolean;
    existingFieldId?: string;
  };
}
```

---

### 6. PUT /object-import/sessions/:id/field-maps (Enhanced)

**Current:** Replaces all field maps for a session.

**Enhancement Needed:** Add `transformRule` validation and processing.

**Transform Rule Structure:**
```typescript
interface TransformRuleDto {
  type: TransformType;
  // Additional params based on type:
  params?: {
    format?: string;      // For date formatting
    prefix?: string;      // For prefix/suffix
    suffix?: string;
    find?: string;        // For replace
    replace?: string;
    separator?: string;   // For split/join
  };
}

enum TransformType {
  // Text transforms
  UPPERCASE = 'UPPERCASE',
  LOWERCASE = 'LOWERCASE',
  CAPITALIZE = 'CAPITALIZE',      // First letter uppercase
  TITLE_CASE = 'TITLE_CASE',      // Each Word Capitalized
  SNAKE_CASE = 'SNAKE_CASE',      // convert_to_snake_case
  CAMEL_CASE = 'CAMEL_CASE',      // convertToCamelCase
  KEBAB_CASE = 'KEBAB_CASE',      // convert-to-kebab-case

  // Cleanup
  TRIM = 'TRIM',                  // Remove leading/trailing whitespace
  TRIM_ALL = 'TRIM_ALL',          // Remove all extra whitespace
  REMOVE_SPECIAL = 'REMOVE_SPECIAL', // Remove special characters

  // Advanced
  PREFIX = 'PREFIX',              // Add prefix
  SUFFIX = 'SUFFIX',              // Add suffix
  REPLACE = 'REPLACE',            // Find and replace
  EXTRACT_NUMBERS = 'EXTRACT_NUMBERS', // Extract only numbers
  EXTRACT_LETTERS = 'EXTRACT_LETTERS', // Extract only letters

  // Type-specific
  PHONE_FORMAT = 'PHONE_FORMAT',  // Format as phone number
  EMAIL_LOWERCASE = 'EMAIL_LOWERCASE', // Lowercase email
  DATE_FORMAT = 'DATE_FORMAT',    // Parse/reformat date
  NUMBER_FORMAT = 'NUMBER_FORMAT' // Format number (decimals, thousands)
}
```

---

## Transform Rules

### Implementation Guide for Transform Helpers

Create a new file: `src/api/client/object-related/import/helpers/transform.helper.ts`

```typescript
// Structure for CODEX to implement:

export enum TransformType {
  UPPERCASE = 'UPPERCASE',
  LOWERCASE = 'LOWERCASE',
  CAPITALIZE = 'CAPITALIZE',
  TITLE_CASE = 'TITLE_CASE',
  SNAKE_CASE = 'SNAKE_CASE',
  CAMEL_CASE = 'CAMEL_CASE',
  KEBAB_CASE = 'KEBAB_CASE',
  TRIM = 'TRIM',
  TRIM_ALL = 'TRIM_ALL',
  REMOVE_SPECIAL = 'REMOVE_SPECIAL',
  PREFIX = 'PREFIX',
  SUFFIX = 'SUFFIX',
  REPLACE = 'REPLACE',
  EXTRACT_NUMBERS = 'EXTRACT_NUMBERS',
  EXTRACT_LETTERS = 'EXTRACT_LETTERS',
  PHONE_FORMAT = 'PHONE_FORMAT',
  EMAIL_LOWERCASE = 'EMAIL_LOWERCASE',
  DATE_FORMAT = 'DATE_FORMAT',
  NUMBER_FORMAT = 'NUMBER_FORMAT',
}

export interface TransformRule {
  type: TransformType;
  params?: Record<string, any>;
}

export interface TransformResult {
  success: boolean;
  value: any;
  error?: string;
}

/**
 * Apply a transform rule to a value
 */
export function applyTransform(value: any, rule: TransformRule): TransformResult {
  // CODEX: Implement switch statement for each TransformType
  // Handle null/undefined gracefully
  // Return { success: true, value: transformed } or { success: false, value: original, error: message }
}

/**
 * Apply multiple transform rules in sequence
 */
export function applyTransforms(value: any, rules: TransformRule[]): TransformResult {
  // CODEX: Apply rules in order, pass output of one as input to next
}

/**
 * Validate that a transform rule is valid and has required params
 */
export function validateTransformRule(rule: TransformRule, fieldType: string): { valid: boolean; error?: string } {
  // CODEX: Check rule type exists, check required params, check compatibility with fieldType
}
```

### Transform Examples

| Transform | Input | Output |
|-----------|-------|--------|
| `UPPERCASE` | "John Doe" | "JOHN DOE" |
| `LOWERCASE` | "John Doe" | "john doe" |
| `CAPITALIZE` | "john doe" | "John doe" |
| `TITLE_CASE` | "john doe" | "John Doe" |
| `SNAKE_CASE` | "John Doe" | "john_doe" |
| `CAMEL_CASE` | "john doe" | "johnDoe" |
| `KEBAB_CASE` | "John Doe" | "john-doe" |
| `TRIM` | "  hello  " | "hello" |
| `TRIM_ALL` | "hello   world" | "hello world" |
| `PREFIX` + `{prefix: "+1"}` | "5551234" | "+15551234" |
| `SUFFIX` + `{suffix: "@company.com"}` | "john" | "john@company.com" |
| `REPLACE` + `{find: "-", replace: ""}` | "555-123-4567" | "5551234567" |

---

## Validation & Required Fields

### Validation Strategy

When the frontend calls `PUT /object-import/sessions/:id/field-maps`, the system should perform validation:

#### 1. Required Field Validation

For each ObjectMap (CRM Object Type being imported):
1. Get all required fields for that object type
2. Check if each required field is either:
   - Mapped from a CSV column (via `targetFieldId`)
   - Has a `defaultValue` specified

**If required field is unmapped AND no default:**
```typescript
interface RequiredFieldValidation {
  objectMapId: string;
  objectTypeName: string;
  missingRequiredFields: {
    fieldId: string;
    fieldName: string;
    fieldApiName: string;
    fieldType: string;
  }[];
}
```

#### 2. Missing Value Handling Options

Frontend should present users with options when CSV column is empty for a required field:

```typescript
interface MissingValueStrategy {
  strategy: 'SKIP_ROW' | 'USE_DEFAULT' | 'FAIL_ROW';
  defaultValue?: any;
}

// Extend UpsertImportFieldMapDto:
interface EnhancedUpsertImportFieldMapDto extends UpsertImportFieldMapDto {
  missingValueStrategy?: MissingValueStrategy;
}
```

**Strategy Options:**
- `SKIP_ROW`: Skip the entire row if this field is empty (useful for critical fields)
- `USE_DEFAULT`: Use the provided `defaultValue` when empty
- `FAIL_ROW`: Mark row as failed if this field is empty (strictest)

#### 3. Validation Response Enhancement

Enhance the validate endpoint response:

```typescript
interface ValidationResultDto {
  isValid: boolean;

  errors: {
    code: string;
    message: string;
    severity: 'ERROR' | 'WARNING';
    context: {
      objectMapId?: string;
      fieldMapId?: string;
      columnIndex?: number;
      fieldId?: string;
    };
  }[];

  summary: {
    totalColumns: number;
    mappedColumns: number;
    unmappedColumns: number;
    objectMapsCount: number;
    requiredFieldsCovered: number;
    requiredFieldsMissing: number;
    draftFieldsCount: number;
    linkRulesCount: number;
  };

  // Per object-type validation
  objectValidations: {
    objectMapId: string;
    objectTypeName: string;
    isValid: boolean;
    requiredFields: {
      fieldId: string;
      fieldName: string;
      isMapped: boolean;
      hasDefault: boolean;
      csvColumnIndex?: number;
    }[];
  }[];
}
```

### Validation Error Codes

| Code | Severity | Description |
|------|----------|-------------|
| `REQUIRED_FIELD_UNMAPPED` | ERROR | A required field has no mapping and no default |
| `NO_OBJECT_MAPS` | ERROR | No object types configured for import |
| `NO_FIELD_MAPS` | ERROR | An object map has no field mappings |
| `DUPLICATE_COLUMN_MAPPING` | WARNING | Same column mapped to multiple fields on same object |
| `TYPE_MISMATCH` | WARNING | CSV value type doesn't match field type |
| `EMPTY_MATCH_FIELDS` | WARNING | UPDATE behavior but no match fields defined |
| `UNMAPPED_COLUMN` | INFO | CSV column not mapped to any field |

---

## Frontend Integration Guide

### Recommended UI Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: FILE UPLOAD                                                      │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  [ Drag & drop CSV file or click to browse ]                        │ │
│ │                                                                     │ │
│ │  Supported: .csv files only, max 50MB                               │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ After upload:                                                            │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  ✓ contacts.csv uploaded (100 rows)                                 │ │
│ │                                                                     │ │
│ │  Preview:                                                           │ │
│ │  ┌────────────┬───────────────┬─────────────┬───────────┐          │ │
│ │  │ name       │ email         │ company     │ phone     │          │ │
│ │  ├────────────┼───────────────┼─────────────┼───────────┤          │ │
│ │  │ John Doe   │ john@acme.com │ Acme Inc    │ 555-1234  │          │ │
│ │  │ Jane Smith │ jane@beta.io  │ Beta Corp   │ 555-5678  │          │ │
│ │  └────────────┴───────────────┴─────────────┴───────────┘          │ │
│ │                                                                     │ │
│ │  [ ] First row is header                                            │ │
│ │                                        [Continue →]                  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: SELECT OBJECT TYPES                                              │
│                                                                          │
│ What would you like to import?                                           │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  [✓] Contact                                                        │ │
│ │      ○ Create new records only                                      │ │
│ │      ● Update existing if found, otherwise create                   │ │
│ │      ○ Skip if record exists                                        │ │
│ │                                                                     │ │
│ │      Match on: [ Email ▼ ] [ + Add field ]                          │ │
│ │                                                                     │ │
│ │  [✓] Company                                                        │ │
│ │      ● Create new records only                                      │ │
│ │      ○ Update existing if found, otherwise create                   │ │
│ │      ○ Skip if record exists                                        │ │
│ │                                                                     │ │
│ │  [ ] Deal                                                           │ │
│ │  [ ] Task                                                           │ │
│ │                                                                     │ │
│ │                                        [← Back] [Continue →]         │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: MAP FIELDS                                                       │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  Contact Fields                                                      │ │
│ │  ┌─────────────┬────────────────┬─────────────┬──────────────────┐  │ │
│ │  │ CSV Column  │ Maps To        │ Transform   │ If Empty         │  │ │
│ │  ├─────────────┼────────────────┼─────────────┼──────────────────┤  │ │
│ │  │ name        │ [Full Name ▼]  │ [None ▼]    │ --               │  │ │
│ │  │ email *     │ [Email ▼]      │ [Lowercase] │ [Skip Row ▼]     │  │ │
│ │  │ phone       │ [+ New Field]  │ [None ▼]    │ [Default: N/A]   │  │ │
│ │  └─────────────┴────────────────┴─────────────┴──────────────────┘  │ │
│ │                                                                     │ │
│ │  * Required field                                                   │ │
│ │                                                                     │ │
│ │  ⚠ Missing required fields: First Name                              │ │
│ │    [ Map from CSV column ] or [ Set default value ]                 │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  Company Fields                                                      │ │
│ │  ┌─────────────┬────────────────┬─────────────┬──────────────────┐  │ │
│ │  │ CSV Column  │ Maps To        │ Transform   │ If Empty         │  │ │
│ │  ├─────────────┼────────────────┼─────────────┼──────────────────┤  │ │
│ │  │ company     │ [Name ▼]       │ [Title Case]│ [Skip Row ▼]     │  │ │
│ │  └─────────────┴────────────────┴─────────────┴──────────────────┘  │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                                        [← Back] [Continue →]             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 4: CONFIGURE RELATIONSHIPS                                          │
│                                                                          │
│ How should imported records be related?                                  │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  Contact → Company                                                   │ │
│ │                                                                     │ │
│ │  ○ Don't link                                                       │ │
│ │  ● Link records from same CSV row                                   │ │
│ │  ○ Link by matching field values                                    │ │
│ │                                                                     │ │
│ │  Using relationship: [ Works At ▼ ] or [+ Create new]               │ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│                                        [← Back] [Continue →]             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 5: REVIEW & IMPORT                                                  │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  Summary                                                             │ │
│ │                                                                     │ │
│ │  File: contacts.csv (100 rows)                                      │ │
│ │                                                                     │ │
│ │  Will create/update:                                                │ │
│ │  • Contacts: up to 100 records (update if email matches)            │ │
│ │  • Companies: up to 100 records (always create new)                 │ │
│ │                                                                     │ │
│ │  New fields to create:                                              │ │
│ │  • Contact.phone_number (Phone)                                     │ │
│ │                                                                     │ │
│ │  Relationships:                                                     │ │
│ │  • Contact → Company (Works At) - from same row                     │ │
│ │                                                                     │ │
│ │  ✓ Validation passed                                                │ │
│ │                                                                     │ │
│ │                                        [← Back] [Start Import]      │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 6: PROGRESS & RESULTS                                               │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  Import Progress                                                     │ │
│ │                                                                     │ │
│ │  ████████████████████████████████████████░░░░░░░░░░  80%            │ │
│ │                                                                     │ │
│ │  Processing row 80 of 100...                                        │ │
│ │                                                                     │ │
│ │  Results so far:                                                    │ │
│ │  ✓ Created: 65                                                      │ │
│ │  ↻ Updated: 10                                                      │ │
│ │  ○ Skipped: 3                                                       │ │
│ │  ✗ Failed: 2                                                        │ │
│ │  🔗 Linked: 75                                                      │ │
│ │                                                                     │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │  Failed Rows                                     [Download Report]   │ │
│ │  ┌─────┬──────────────────────────────────────────────────────────┐ │ │
│ │  │ Row │ Error                                                    │ │ │
│ │  ├─────┼──────────────────────────────────────────────────────────┤ │ │
│ │  │ 15  │ Invalid email format: "not-an-email"                     │ │ │
│ │  │ 42  │ Required field "email" is empty                          │ │ │
│ │  └─────┴──────────────────────────────────────────────────────────┘ │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### API Call Sequence for Frontend

```typescript
// 1. Get presigned URL
const { uploadUrl, storageKey } = await api.post('/object-import/files/upload-url', {
  filename: file.name,
  contentType: file.type
});

// 2. Upload to S3 directly
await fetch(uploadUrl, { method: 'PUT', body: file });

// 3. Parse CSV locally (or on server) to get columns/sample
const { columns, sampleRows, rowCount } = parseCSV(file);

// 4. Create file metadata
const fileRecord = await api.post('/object-import/files/metadata', {
  storageKey,
  filename: file.name,
  mimeType: file.type,
  size: file.size,
  hasHeader: true,
  columns,
  sampleRows: sampleRows.slice(0, 5),
  rowCount
});

// 5. Create session
const session = await api.post('/object-import/sessions', {
  fileId: fileRecord.id
});

// 6. Get metadata (for UI dropdowns)
const metadata = await api.get('/object-import/metadata');

// 7. Configure object maps
const objectMaps = await api.put(`/object-import/sessions/${session.id}/object-maps`, [
  { objectTypeId: 'contact-uuid', matchBehavior: 'UPDATE', matchFields: ['email-field-uuid'] },
  { objectTypeId: 'company-uuid', matchBehavior: 'CREATE' }
]);

// 8. Create draft fields if needed
const draftField = await api.post(`/object-import/sessions/${session.id}/draft-fields`, {
  objectTypeId: 'contact-uuid',
  name: 'Phone Number',
  apiName: 'phone_number',
  fieldType: 'PHONE'
});

// 9. Configure field maps
await api.put(`/object-import/sessions/${session.id}/field-maps`, [
  { objectMapId: objectMaps[0].id, sourceIndex: 0, targetFieldId: 'name-field-uuid' },
  { objectMapId: objectMaps[0].id, sourceIndex: 1, targetFieldId: 'email-field-uuid' },
  { objectMapId: objectMaps[0].id, sourceIndex: 3, draftFieldId: draftField.id },
  { objectMapId: objectMaps[1].id, sourceIndex: 2, targetFieldId: 'company-name-uuid' }
]);

// 10. Configure link rules
await api.put(`/object-import/sessions/${session.id}/link-rules`, [{
  mode: 'ROW',
  associationTypeId: 'works-at-uuid',
  sourceObjectTypeId: 'contact-uuid',
  targetObjectTypeId: 'company-uuid'
}]);

// 11. Validate
const validated = await api.post(`/object-import/sessions/${session.id}/validate`);
if (validated.status !== 'VALIDATED') {
  // Handle validation errors
}

// 12. Parse rows
await api.post(`/object-import/sessions/${session.id}/rows`);

// 13. Start job
const job = await api.post(`/object-import/sessions/${session.id}/jobs`);

// 14. Poll for completion
const pollJob = async () => {
  const status = await api.get(`/object-import/sessions/${session.id}/jobs/${job.id}`);
  if (status.status === 'RUNNING' || status.status === 'QUEUED') {
    setTimeout(pollJob, 2000);
  } else {
    // Show results
  }
};
pollJob();

// 15. Get results if needed
const results = await api.get(`/object-import/sessions/${session.id}/results`, {
  params: { status: 'FAILED', page: 1, limit: 50 }
});
```

---

## Quick Reference: Complete Endpoint List

### Existing Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/object-import/health` | Health check |
| POST | `/object-import/files/upload-url` | Get S3 presigned URL |
| POST | `/object-import/files/metadata` | Create file record |
| POST | `/object-import/sessions` | Create session |
| GET | `/object-import/association-types` | List association types |
| POST | `/object-import/sessions/:id/draft-fields` | Create draft field |
| PUT | `/object-import/sessions/:id/object-maps` | Upsert object maps |
| DELETE | `/object-import/sessions/:id/object-maps/:omId/match-fields/:fId` | Remove match field |
| PUT | `/object-import/sessions/:id/field-maps` | Replace field maps |
| POST | `/object-import/sessions/:id/draft-association-types` | Create draft assoc type |
| PUT | `/object-import/sessions/:id/link-rules` | Add link rules |
| PUT | `/object-import/sessions/:id/link-rules/:ruleId` | Update link rule |
| DELETE | `/object-import/sessions/:id/link-rules/:ruleId` | Delete link rule |
| POST | `/object-import/sessions/:id/validate` | Validate session |
| POST | `/object-import/sessions/:id/rows` | Parse CSV rows |
| POST | `/object-import/sessions/:id/jobs` | Create import job |
| GET | `/object-import/sessions/:id/jobs/:jobId` | Get job status |
| GET | `/object-import/sessions/:id/results` | List results |

### New Endpoints to Implement
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/object-import/metadata` | Get system metadata (transforms, types, etc.) |
| GET | `/object-import/sessions` | List all sessions |
| GET | `/object-import/sessions/:id` | Get session detail with mappings |
| GET | `/object-import/sessions/:id/object-maps/:objectMapId` | Get single object map detail |
| GET | `/object-import/sessions/:id/draft-fields/:draftFieldId` | Get single draft field |
