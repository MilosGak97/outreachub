# CRM Object Instance Management - Execution Plan

> **Feature:** Runtime CRM Objects - Creating, viewing, updating, and associating actual data records

---

## Feature Overview

| Field | Value |
|-------|-------|
| **Feature Name** | CRM Object Instance Management |
| **Status** | **IMPLEMENTED** |
| **Complexity** | Complex (30+ endpoints) |
| **Dependencies** | CrmObjectType, CrmObjectField, CrmAssociationType (all implemented) |

### User Story

```
AS A company user
I WANT TO create, view, edit, and delete CRM object records
SO THAT I can manage my business data (contacts, deals, companies, etc.) with full field values and associations
```

### One-Sentence Summary
> Users can create actual CRM records (like a Contact "John Doe"), fill in field values, and link them to other records through associations.

---

## Conceptual Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SCHEMA LAYER (Already Built)                     │
├─────────────────────────────────────────────────────────────────────────┤
│  CrmObjectType          CrmObjectField           CrmAssociationType     │
│  ├─ name: "Contact"     ├─ name: "Email"         ├─ name: "Deal→Contact"│
│  ├─ apiName: "contact"  ├─ fieldType: EMAIL      ├─ sourceCardinality   │
│  └─ description         ├─ isRequired: true      └─ targetCardinality   │
│                         └─ shape/configShape                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER (To Be Built)                         │
├─────────────────────────────────────────────────────────────────────────┤
│  CrmObject                              CrmObjectAssociation            │
│  ├─ id: uuid                            ├─ id: uuid                     │
│  ├─ objectType: CrmObjectType           ├─ type: CrmAssociationType     │
│  ├─ displayName: "John Doe"             ├─ sourceObject: CrmObject      │
│  ├─ fieldValues: {                      ├─ targetObject: CrmObject      │
│  │    "email": "john@example.com",      ├─ reverseOf: CrmObjectAssoc    │
│  │    "phone": { ... },                 └─ metadata: { ... }            │
│  │    "deal_value": 50000               │                               │
│  │  }                                   │                               │
│  └─ company: Company                    │                               │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Core CRUD
- [x] User can create a new CRM object record with field values
- [x] User can view a single CRM object with all field values
- [x] User can list/search CRM objects of a specific type with pagination
- [x] User can update field values on an existing CRM object
- [x] User can delete a CRM object (with association cleanup)

### Field Value Management
- [x] Field values are validated against their field type definitions
- [x] Required fields are enforced on create
- [x] Protected field types (phone, email, address) handle encryption/masking
- [ ] Formula fields are calculated on read (not stored) - *deferred*
- [x] Select/Multi-select values are validated against options

### Associations
- [x] User can create an association between two objects
- [x] User can view all associations for an object (both directions)
- [x] User can remove an association
- [x] Cardinality constraints are enforced (ONE vs MANY)
- [x] Bidirectional associations auto-create reverse links

### Search & Filtering
- [x] User can search objects by displayName
- [x] User can filter by specific field values
- [x] User can sort by any field or displayName
- [x] Pagination with total count

---

# PHASE 1: Define & Design

## 1.1 User Flow Map

```
[Dashboard / Object Type View]
       ↓
[Click "New Contact"] ───────────────────────────────────────────┐
       ↓                                                         │
[Object Creation Form]                                           │
  ├─ displayName: "John Doe" (required)                          │
  ├─ email: "john@example.com" ──→ [Validate EMAIL type]         │
  ├─ phone: {...} ──→ [Validate PHONE shape]                     │
  └─ company_size: "enterprise" ──→ [Validate SELECT options]    │
       ↓                                                         │
[Submit] ──→ [Validation failed?] ──→ [Show field errors] ───────┘
       ↓
[Object created, redirect to detail view]
       ↓
[Object Detail View]
  ├─ View all field values (formatted by type)
  ├─ Click field to edit inline
  ├─ View associations panel
  │    └─ "Linked Deals (3)" ──→ [Click to expand]
  └─ [+ Add Association] ──→ [Association picker modal]
       ↓
[Association Picker]
  ├─ Select association type: "deal_contacts"
  ├─ Search/select target object: "Acme Deal"
  └─ [Link] ──→ [Association created]
```

---

## 1.2 Endpoint Inventory

### CRM Objects (`/crm-object`)

| Method | Endpoint | Purpose | Guard |
|--------|----------|---------|-------|
| POST | `/crm-object` | Create new object | UserAuthGuard |
| GET | `/crm-object` | List objects (filtered by objectTypeId) | UserAuthGuard |
| GET | `/crm-object/:id` | Get single object with field values | UserAuthGuard |
| GET | `/crm-object/:id/full` | Get object with fields + associations | UserAuthGuard |
| PATCH | `/crm-object/:id` | Update displayName and/or field values | UserAuthGuard |
| DELETE | `/crm-object/:id` | Delete object (cascades associations) | UserAuthGuard |
| POST | `/crm-object/bulk` | Bulk create objects | UserAuthGuard |
| PATCH | `/crm-object/bulk` | Bulk update objects | UserAuthGuard |
| DELETE | `/crm-object/bulk` | Bulk delete objects | UserAuthGuard |
| POST | `/crm-object/search` | Advanced search with field filters | UserAuthGuard |
| GET | `/crm-object/:id/field/:apiName` | Get single field value | UserAuthGuard |
| PATCH | `/crm-object/:id/field/:apiName` | Update single field value | UserAuthGuard |

### CRM Object Associations (`/crm-object-association`)

| Method | Endpoint | Purpose | Guard |
|--------|----------|---------|-------|
| POST | `/crm-object-association` | Create association between objects | UserAuthGuard |
| GET | `/crm-object-association` | List associations (filtered) | UserAuthGuard |
| GET | `/crm-object-association/:id` | Get single association | UserAuthGuard |
| DELETE | `/crm-object-association/:id` | Remove association | UserAuthGuard |
| GET | `/crm-object/:id/associations` | Get all associations for an object | UserAuthGuard |
| GET | `/crm-object/:id/associations/:typeId` | Get associations of specific type | UserAuthGuard |
| POST | `/crm-object/:id/associations/bulk` | Bulk create associations | UserAuthGuard |
| DELETE | `/crm-object/:id/associations/bulk` | Bulk remove associations | UserAuthGuard |

---

## 1.3 Endpoint Grouping (By Flow)

### Group 1: CREATE Chain (Minimum Viable Flow)

> After this group: User can create and view CRM object records.

| Order | Method | Endpoint | Purpose | Depends On |
|-------|--------|----------|---------|------------|
| 1 | POST | `/crm-object` | Create object with field values | ObjectType exists |
| 2 | GET | `/crm-object/:id` | View created object | Step 1 |
| 3 | GET | `/crm-object` | List objects by type | ObjectType exists |
| 4 | GET | `/crm-object/:id/full` | Object with associations | Step 1 |

**Test Flow After Group 1:**
```
1. Create Contact with { displayName: "John", fieldValues: { email: "john@test.com" } }
   → expect 201 + { id: "obj_123", displayName: "John", fieldValues: {...} }
2. Get object obj_123
   → expect 200 + full object with formatted fields
3. List objects where objectTypeId = contact_type_id
   → expect 200 + { data: [...], total: 1 }
```

---

### Group 2: UPDATE Operations

> After this group: User can modify existing records.

| Order | Method | Endpoint | Purpose | Priority |
|-------|--------|----------|---------|----------|
| 1 | PATCH | `/crm-object/:id` | Update displayName/fieldValues | P1 |
| 2 | PATCH | `/crm-object/:id/field/:apiName` | Update single field | P2 |
| 3 | PATCH | `/crm-object/bulk` | Bulk update | P3 |

---

### Group 3: DELETE Operations

> After this group: User can remove records.

| Order | Method | Endpoint | Cascade Behavior | Priority |
|-------|--------|----------|------------------|----------|
| 1 | DELETE | `/crm-object/:id` | Deletes all associations | P1 |
| 2 | DELETE | `/crm-object/bulk` | Bulk delete | P3 |

---

### Group 4: ASSOCIATION Management

> After this group: User can link objects together.

| Order | Method | Endpoint | Purpose | Priority |
|-------|--------|----------|---------|----------|
| 1 | POST | `/crm-object-association` | Create single association | P1 |
| 2 | GET | `/crm-object/:id/associations` | List all for object | P1 |
| 3 | GET | `/crm-object/:id/associations/:typeId` | Filter by type | P1 |
| 4 | DELETE | `/crm-object-association/:id` | Remove association | P1 |
| 5 | POST | `/crm-object/:id/associations/bulk` | Bulk link | P2 |
| 6 | DELETE | `/crm-object/:id/associations/bulk` | Bulk unlink | P2 |

---

### Group 5: SEARCH & Advanced

> After this group: User has full search capabilities.

| Method | Endpoint | Purpose | Priority |
|--------|----------|---------|----------|
| POST | `/crm-object/search` | Advanced field-based search | P2 |
| GET | `/crm-object/:id/field/:apiName` | Get single field | P3 |

---

## 1.4 Data Models & Types

### Existing Entity: CrmObject

```typescript
// src/api/entities/object/crm-object.entity.ts (EXISTS)
@Entity('crm-objects')
export class CrmObject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => CrmObjectType, (objectType) => objectType.objects)
  objectType: CrmObjectType;

  @ManyToOne(() => Company, (company) => company.crmObjects)
  company: Company;

  @OneToMany(() => CrmObjectAssociation, (assoc) => assoc.sourceObject)
  sourceAssociations: CrmObjectAssociation[];

  @OneToMany(() => CrmObjectAssociation, (assoc) => assoc.targetObject)
  targetAssociations: CrmObjectAssociation[];

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ type: 'jsonb', default: {} })
  fieldValues: Record<string, FieldValue>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### Existing Entity: CrmObjectAssociation

```typescript
// src/api/entities/object/crm-object-association.entity.ts (EXISTS)
@Entity('crm-object-associations')
@Unique(['company', 'type', 'sourceObject', 'targetObject'])
export class CrmObjectAssociation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, (company) => company.crmObjectAssociations)
  company: Company;

  @ManyToOne(() => CrmObject, (object) => object.sourceAssociations)
  sourceObject: CrmObject;

  @ManyToOne(() => CrmObject, (object) => object.targetAssociations)
  targetObject: CrmObject;

  @ManyToOne(() => CrmAssociationType)
  type: CrmAssociationType;

  @ManyToOne(() => CrmObjectAssociation, { nullable: true })
  reverseOf?: CrmObjectAssociation;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

### Request DTOs

```typescript
// ============================================
// crm-object/dto/requests/create-crm-object.dto.ts
// ============================================

export class CreateCrmObjectDto {
  @IsUUID()
  @ApiProperty({ description: 'ID of the CrmObjectType this object belongs to' })
  objectTypeId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({
    description: 'Field values keyed by apiName',
    example: { email: 'john@example.com', phone: { countryCode: '+1', number: '5551234567' } }
  })
  fieldValues?: Record<string, any>;
}

// ============================================
// crm-object/dto/requests/update-crm-object.dto.ts
// ============================================

export class UpdateCrmObjectDto {
  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({ required: false })
  displayName?: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({
    description: 'Partial field values to update (merged with existing)',
    required: false
  })
  fieldValues?: Record<string, any>;
}

// ============================================
// crm-object/dto/requests/update-single-field.dto.ts
// ============================================

export class UpdateSingleFieldDto {
  @ApiProperty({ description: 'The new value for the field (type depends on field definition)' })
  value: any;
}

// ============================================
// crm-object/dto/requests/get-all-objects-query.dto.ts
// ============================================

export class GetAllObjectsQueryDto {
  @IsUUID()
  @ApiProperty({ description: 'Filter by object type ID' })
  objectTypeId: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiProperty({ example: 20, default: 20 })
  limit: number = 20;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  @ApiProperty({ example: 0, default: 0 })
  offset: number = 0;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Search in displayName' })
  searchQuery?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Sort by field apiName or "displayName", "createdAt", "updatedAt"' })
  sortBy?: string;

  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  @ApiProperty({ required: false, enum: ['ASC', 'DESC'], default: 'DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// ============================================
// crm-object/dto/requests/search-objects.dto.ts
// ============================================

export class FieldFilterDto {
  @IsString()
  @ApiProperty({ description: 'Field apiName' })
  field: string;

  @IsEnum(['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'in', 'isNull', 'isNotNull'])
  @ApiProperty({ enum: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'contains', 'startsWith', 'endsWith', 'in', 'isNull', 'isNotNull'] })
  operator: string;

  @IsOptional()
  @ApiProperty({ description: 'Value to compare (not needed for isNull/isNotNull)' })
  value?: any;
}

export class SearchObjectsDto {
  @IsUUID()
  @ApiProperty()
  objectTypeId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldFilterDto)
  @IsOptional()
  @ApiProperty({ type: [FieldFilterDto], required: false })
  filters?: FieldFilterDto[];

  @IsEnum(['AND', 'OR'])
  @IsOptional()
  @ApiProperty({ enum: ['AND', 'OR'], default: 'AND' })
  filterLogic?: 'AND' | 'OR' = 'AND';

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset: number = 0;

  @IsString()
  @IsOptional()
  sortBy?: string;

  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}

// ============================================
// crm-object/dto/requests/bulk-create-objects.dto.ts
// ============================================

export class BulkObjectItemDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  displayName: string;

  @IsObject()
  @IsOptional()
  fieldValues?: Record<string, any>;
}

export class BulkCreateObjectsDto {
  @IsUUID()
  objectTypeId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkObjectItemDto)
  @ArrayMaxSize(100)
  @ApiProperty({ type: [BulkObjectItemDto] })
  objects: BulkObjectItemDto[];
}

// ============================================
// crm-object/dto/requests/bulk-update-objects.dto.ts
// ============================================

export class BulkUpdateItemDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  displayName?: string;

  @IsObject()
  @IsOptional()
  fieldValues?: Record<string, any>;
}

export class BulkUpdateObjectsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateItemDto)
  @ArrayMaxSize(100)
  objects: BulkUpdateItemDto[];
}

// ============================================
// crm-object/dto/requests/bulk-delete-objects.dto.ts
// ============================================

export class BulkDeleteObjectsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(100)
  ids: string[];
}

// ============================================
// crm-object-association/dto/requests/create-association.dto.ts
// ============================================

export class CreateCrmObjectAssociationDto {
  @IsUUID()
  @ApiProperty({ description: 'The association type ID' })
  typeId: string;

  @IsUUID()
  @ApiProperty({ description: 'Source object ID' })
  sourceObjectId: string;

  @IsUUID()
  @ApiProperty({ description: 'Target object ID' })
  targetObjectId: string;

  @IsObject()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Optional metadata for this association' })
  metadata?: Record<string, any>;
}

// ============================================
// crm-object-association/dto/requests/get-associations-query.dto.ts
// ============================================

export class GetAssociationsQueryDto {
  @IsUUID()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Filter by source object ID' })
  sourceObjectId?: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Filter by target object ID' })
  targetObjectId?: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Filter by association type ID' })
  typeId?: string;

  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit: number = 20;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset: number = 0;
}

// ============================================
// crm-object-association/dto/requests/bulk-associations.dto.ts
// ============================================

export class BulkAssociationItemDto {
  @IsUUID()
  typeId: string;

  @IsUUID()
  targetObjectId: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class BulkCreateAssociationsDto {
  @IsUUID()
  sourceObjectId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAssociationItemDto)
  @ArrayMaxSize(50)
  associations: BulkAssociationItemDto[];
}

export class BulkDeleteAssociationsDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(50)
  associationIds: string[];
}
```

---

### Response DTOs

```typescript
// ============================================
// crm-object/dto/responses/crm-object-response.dto.ts
// ============================================

export class CrmObjectResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '660e8400-e29b-41d4-a716-446655440000' })
  objectTypeId: string;

  @ApiProperty({ example: 'contact' })
  objectTypeApiName: string;

  @ApiProperty({ example: 'Contact' })
  objectTypeName: string;

  @ApiProperty({ example: 'John Doe' })
  displayName: string;

  @ApiProperty({
    description: 'Field values keyed by apiName',
    example: {
      email: 'john@example.com',
      phone: { countryCode: '+1', number: '5551234567', formatted: '+1 (555) 123-4567' },
      deal_value: 50000
    }
  })
  fieldValues: Record<string, any>;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  updatedAt: string;
}

// ============================================
// crm-object/dto/responses/crm-object-list-item.dto.ts
// ============================================

export class CrmObjectListItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ description: 'Selected field values for list display' })
  fieldValues: Record<string, any>;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}

// ============================================
// crm-object/dto/responses/crm-object-list-response.dto.ts
// ============================================

export class CrmObjectListResponseDto {
  @ApiProperty({ type: [CrmObjectListItemDto] })
  data: CrmObjectListItemDto[];

  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 0 })
  offset: number;
}

// ============================================
// crm-object/dto/responses/crm-object-full-response.dto.ts
// ============================================

export class AssociationSummaryDto {
  @ApiProperty()
  typeId: string;

  @ApiProperty()
  typeName: string;

  @ApiProperty()
  typeApiName: string;

  @ApiProperty({ description: 'Direction of association from this object perspective' })
  direction: 'source' | 'target';

  @ApiProperty()
  count: number;

  @ApiProperty({ type: [CrmObjectListItemDto], description: 'Preview of associated objects (first 5)' })
  preview: CrmObjectListItemDto[];
}

export class FieldWithMetadataDto {
  @ApiProperty()
  apiName: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: FieldType })
  fieldType: FieldType;

  @ApiProperty()
  isRequired: boolean;

  @ApiProperty({ nullable: true })
  value: any;

  @ApiPropertyOptional()
  shape?: Record<string, any>;

  @ApiPropertyOptional()
  configShape?: Record<string, any>;
}

export class CrmObjectFullResponseDto extends CrmObjectResponseDto {
  @ApiProperty({ type: [FieldWithMetadataDto], description: 'Field values with metadata for rendering' })
  fields: FieldWithMetadataDto[];

  @ApiProperty({ type: [AssociationSummaryDto], description: 'Summary of associations' })
  associations: AssociationSummaryDto[];
}

// ============================================
// crm-object/dto/responses/bulk-create-response.dto.ts
// ============================================

export class BulkCreateResultItemDto {
  @ApiProperty()
  index: number;

  @ApiProperty()
  success: boolean;

  @ApiPropertyOptional()
  id?: string;

  @ApiPropertyOptional()
  error?: string;
}

export class BulkCreateObjectsResponseDto {
  @ApiProperty()
  total: number;

  @ApiProperty()
  successful: number;

  @ApiProperty()
  failed: number;

  @ApiProperty({ type: [BulkCreateResultItemDto] })
  results: BulkCreateResultItemDto[];
}

// ============================================
// crm-object-association/dto/responses/association-response.dto.ts
// ============================================

export class CrmObjectAssociationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  typeId: string;

  @ApiProperty()
  typeName: string;

  @ApiProperty()
  typeApiName: string;

  @ApiProperty()
  sourceObjectId: string;

  @ApiProperty()
  sourceObjectDisplayName: string;

  @ApiProperty()
  sourceObjectTypeApiName: string;

  @ApiProperty()
  targetObjectId: string;

  @ApiProperty()
  targetObjectDisplayName: string;

  @ApiProperty()
  targetObjectTypeApiName: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  createdAt: string;
}

// ============================================
// crm-object-association/dto/responses/association-list-response.dto.ts
// ============================================

export class AssociationListResponseDto {
  @ApiProperty({ type: [CrmObjectAssociationResponseDto] })
  data: CrmObjectAssociationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}

// ============================================
// crm-object-association/dto/responses/object-associations-response.dto.ts
// ============================================

export class LinkedObjectDto {
  @ApiProperty()
  associationId: string;

  @ApiProperty()
  objectId: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty()
  objectTypeApiName: string;

  @ApiProperty()
  objectTypeName: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  associatedAt: string;
}

export class AssociationTypeGroupDto {
  @ApiProperty()
  typeId: string;

  @ApiProperty()
  typeName: string;

  @ApiProperty()
  typeApiName: string;

  @ApiProperty({ description: 'Whether this object is source or target in the association type' })
  role: 'source' | 'target';

  @ApiProperty({ description: 'The label for this direction (e.g., "Related Contacts" or "Related Deals")' })
  label: string;

  @ApiProperty({ type: [LinkedObjectDto] })
  linkedObjects: LinkedObjectDto[];

  @ApiProperty()
  total: number;
}

export class ObjectAssociationsResponseDto {
  @ApiProperty()
  objectId: string;

  @ApiProperty({ type: [AssociationTypeGroupDto] })
  associationGroups: AssociationTypeGroupDto[];
}
```

---

### Error Codes

```typescript
// src/api/enums/object/crm-object-error-codes.enum.ts

export enum CrmObjectErrorCode {
  // Generic
  NOT_FOUND = 'OBJECT_NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',

  // Object-specific
  OBJECT_TYPE_NOT_FOUND = 'OBJECT_TYPE_NOT_FOUND',
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  FIELD_NOT_FOUND = 'FIELD_NOT_FOUND',
  FIELD_TYPE_MISMATCH = 'FIELD_TYPE_MISMATCH',
  INVALID_SELECT_OPTION = 'INVALID_SELECT_OPTION',

  // Association-specific
  ASSOCIATION_TYPE_NOT_FOUND = 'ASSOCIATION_TYPE_NOT_FOUND',
  ASSOCIATION_NOT_FOUND = 'ASSOCIATION_NOT_FOUND',
  ASSOCIATION_ALREADY_EXISTS = 'ASSOCIATION_ALREADY_EXISTS',
  CARDINALITY_VIOLATION = 'CARDINALITY_VIOLATION',
  SELF_ASSOCIATION_NOT_ALLOWED = 'SELF_ASSOCIATION_NOT_ALLOWED',
  INVALID_OBJECT_TYPE_FOR_ASSOCIATION = 'INVALID_OBJECT_TYPE_FOR_ASSOCIATION',

  // Bulk operations
  BULK_LIMIT_EXCEEDED = 'BULK_LIMIT_EXCEEDED',
  PARTIAL_BULK_FAILURE = 'PARTIAL_BULK_FAILURE',
}
```

---

## 1.5 Field Value Validation

### Validation Rules by Field Type

| FieldType | Validation Rules | Storage Format |
|-----------|-----------------|----------------|
| STRING | MaxLength from shape, optional pattern | `string` |
| NUMBER | Min/Max from shape, optional precision | `number` |
| BOOLEAN | Must be true/false | `boolean` |
| DATE | Valid ISO date string | `string` (ISO) |
| DATETIME | Valid ISO datetime string | `string` (ISO) |
| JSON | Valid JSON, optional schema | `object` |
| PHONE | Must match phone shape structure | `{ countryCode, number, extension? }` |
| EMAIL | Valid email format | `string` |
| URL | Valid URL format | `string` |
| ADDRESS | Must match address shape | `{ street, city, state, zip, country }` |
| TEXTAREA | MaxLength from shape | `string` |
| SELECT | Value must be in configShape.options | `string` |
| MULTI_SELECT | All values must be in configShape.options | `string[]` |
| CURRENCY | { amount: number, currency: string } | `{ amount, currency }` |
| FORMULA | NOT stored, calculated on read | N/A |
| PROTECTED_* | Encrypted before storage | `string` (encrypted) |

### Validation Service Structure

```typescript
// src/api/client/object-related/crm-object/services/field-value-validator.service.ts

@Injectable()
export class FieldValueValidatorService {

  async validateFieldValues(
    objectTypeId: string,
    fieldValues: Record<string, any>,
    isCreate: boolean,
  ): Promise<ValidationResult> {
    // 1. Load field definitions for the object type
    // 2. Check required fields (if isCreate)
    // 3. Validate each provided field value against its type
    // 4. Return validation errors or sanitized values
  }

  private validateStringField(value: any, field: CrmObjectField): FieldValidationResult;
  private validateNumberField(value: any, field: CrmObjectField): FieldValidationResult;
  private validateBooleanField(value: any, field: CrmObjectField): FieldValidationResult;
  private validateDateField(value: any, field: CrmObjectField): FieldValidationResult;
  private validatePhoneField(value: any, field: CrmObjectField): FieldValidationResult;
  private validateEmailField(value: any, field: CrmObjectField): FieldValidationResult;
  private validateSelectField(value: any, field: CrmObjectField): FieldValidationResult;
  private validateMultiSelectField(value: any, field: CrmObjectField): FieldValidationResult;
  // ... etc
}
```

---

## 1.6 Association Cardinality Enforcement

### Cardinality Rules

| Source | Target | Rule |
|--------|--------|------|
| ONE | ONE | Only one association allowed from source, only one to target |
| ONE | MANY | Only one association allowed from source |
| MANY | ONE | Only one association allowed to target |
| MANY | MANY | No restrictions |

### Enforcement Logic

```typescript
async createAssociation(dto: CreateCrmObjectAssociationDto): Promise<string> {
  const associationType = await this.getAssociationType(dto.typeId);

  // Validate object types match the association type definition
  const sourceObject = await this.getObject(dto.sourceObjectId);
  const targetObject = await this.getObject(dto.targetObjectId);

  if (sourceObject.objectType.id !== associationType.sourceObjectType.id) {
    throw new BadRequestException(CrmObjectErrorCode.INVALID_OBJECT_TYPE_FOR_ASSOCIATION);
  }
  if (targetObject.objectType.id !== associationType.targetObjectType.id) {
    throw new BadRequestException(CrmObjectErrorCode.INVALID_OBJECT_TYPE_FOR_ASSOCIATION);
  }

  // Check cardinality constraints
  if (associationType.sourceCardinality === 'ONE') {
    const existingFromSource = await this.countAssociations(dto.typeId, dto.sourceObjectId, 'source');
    if (existingFromSource > 0) {
      throw new BadRequestException(CrmObjectErrorCode.CARDINALITY_VIOLATION);
    }
  }

  if (associationType.targetCardinality === 'ONE') {
    const existingToTarget = await this.countAssociations(dto.typeId, dto.targetObjectId, 'target');
    if (existingToTarget > 0) {
      throw new BadRequestException(CrmObjectErrorCode.CARDINALITY_VIOLATION);
    }
  }

  // Create association
  const association = await this.repo.create({ ... });

  // If bidirectional, create reverse association
  if (associationType.isBidirectional) {
    await this.repo.create({
      type: associationType,
      sourceObject: targetObject,
      targetObject: sourceObject,
      reverseOf: association,
    });
  }

  return association.id;
}
```

---

## 1.7 Edge Cases & Questions

| Question / Edge Case | Answer / Decision |
|---------------------|-------------------|
| What happens to associations when object is deleted? | CASCADE delete all associations involving this object |
| Can an object be associated with itself? | No, `SELF_ASSOCIATION_NOT_ALLOWED` error |
| How are formula fields handled? | Calculated on read, never stored in fieldValues |
| What if required field is missing on create? | 400 `REQUIRED_FIELD_MISSING` with field list |
| What if field doesn't exist for object type? | Silently ignored (flexible schema) OR strict mode error |
| Max objects per bulk operation? | 100 |
| Max associations per bulk operation? | 50 |
| Can displayName be empty? | No, minimum 1 character required |
| How are protected fields handled on read? | Masked by default, full value requires special permission |
| What if association type deleted with existing associations? | Already blocked by CrmAssociationType delete logic |

---

# PHASE 2: Architecture & Backend

## 2.1 File Structure

```
src/api/client/object-related/
├── crm-object/
│   ├── dto/
│   │   ├── requests/
│   │   │   ├── create-crm-object.dto.ts
│   │   │   ├── update-crm-object.dto.ts
│   │   │   ├── update-single-field.dto.ts
│   │   │   ├── get-all-objects-query.dto.ts
│   │   │   ├── search-objects.dto.ts
│   │   │   ├── bulk-create-objects.dto.ts
│   │   │   ├── bulk-update-objects.dto.ts
│   │   │   ├── bulk-delete-objects.dto.ts
│   │   │   └── index.ts
│   │   ├── responses/
│   │   │   ├── crm-object-response.dto.ts
│   │   │   ├── crm-object-list-item.dto.ts
│   │   │   ├── crm-object-list-response.dto.ts
│   │   │   ├── crm-object-full-response.dto.ts
│   │   │   ├── bulk-create-response.dto.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── services/
│   │   ├── field-value-validator.service.ts
│   │   ├── field-value-transformer.service.ts
│   │   └── formula-calculator.service.ts
│   ├── crm-object.controller.ts
│   ├── crm-object.service.ts
│   └── crm-object.module.ts
│
├── crm-object-association/
│   ├── dto/
│   │   ├── requests/
│   │   │   ├── create-association.dto.ts
│   │   │   ├── get-associations-query.dto.ts
│   │   │   ├── bulk-associations.dto.ts
│   │   │   └── index.ts
│   │   ├── responses/
│   │   │   ├── association-response.dto.ts
│   │   │   ├── association-list-response.dto.ts
│   │   │   ├── object-associations-response.dto.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── crm-object-association.controller.ts
│   ├── crm-object-association.service.ts
│   └── crm-object-association.module.ts
```

---

## 2.2 Implementation Tracker

### Group 1: Core CRUD

| Order | Endpoint | Impl | Tested | Notes |
|-------|----------|------|--------|-------|
| 1 | `POST /crm-object` | [ ] | [ ] | Validate fields, create record |
| 2 | `GET /crm-object/:id` | [ ] | [ ] | Include objectType info |
| 3 | `GET /crm-object` | [ ] | [ ] | Pagination, search, filter by type |
| 4 | `GET /crm-object/:id/full` | [ ] | [ ] | Include fields metadata + associations |

### Group 2: Update Operations

| Order | Endpoint | Impl | Tested | Notes |
|-------|----------|------|--------|-------|
| 1 | `PATCH /crm-object/:id` | [ ] | [ ] | Merge fieldValues |
| 2 | `PATCH /crm-object/:id/field/:apiName` | [ ] | [ ] | Single field update |
| 3 | `PATCH /crm-object/bulk` | [ ] | [ ] | |

### Group 3: Delete Operations

| Order | Endpoint | Impl | Tested | Notes |
|-------|----------|------|--------|-------|
| 1 | `DELETE /crm-object/:id` | [ ] | [ ] | Cascade associations |
| 2 | `DELETE /crm-object/bulk` | [ ] | [ ] | |

### Group 4: Associations

| Order | Endpoint | Impl | Tested | Notes |
|-------|----------|------|--------|-------|
| 1 | `POST /crm-object-association` | [ ] | [ ] | Cardinality check |
| 2 | `GET /crm-object/:id/associations` | [ ] | [ ] | Grouped by type |
| 3 | `GET /crm-object/:id/associations/:typeId` | [ ] | [ ] | Single type |
| 4 | `DELETE /crm-object-association/:id` | [ ] | [ ] | Handle reverse |
| 5 | `GET /crm-object-association` | [ ] | [ ] | General list |
| 6 | `POST /crm-object/:id/associations/bulk` | [ ] | [ ] | |
| 7 | `DELETE /crm-object/:id/associations/bulk` | [ ] | [ ] | |

### Group 5: Search & Advanced

| Order | Endpoint | Impl | Tested | Notes |
|-------|----------|------|--------|-------|
| 1 | `POST /crm-object/search` | [ ] | [ ] | Field-based filters |
| 2 | `GET /crm-object/:id/field/:apiName` | [ ] | [ ] | Single field read |
| 3 | `POST /crm-object/bulk` | [ ] | [ ] | Bulk create |

---

## 2.3 Repository Methods Needed

### CrmObjectRepository

```typescript
// Already extends BaseCompanyRepository<CrmObject>

// New methods needed:
async createObject(dto: CreateCrmObjectDto, companyId: string): Promise<CrmObject>;

async getObjectById(id: string, relations?: string[]): Promise<CrmObject | null>;

async getObjectsWithPagination(
  query: GetAllObjectsQueryDto,
): Promise<{ data: CrmObject[]; total: number }>;

async updateObject(id: string, dto: UpdateCrmObjectDto): Promise<void>;

async deleteObject(id: string): Promise<void>;

async searchObjects(
  dto: SearchObjectsDto,
): Promise<{ data: CrmObject[]; total: number }>;

async bulkCreate(objects: CreateCrmObjectDto[]): Promise<BulkCreateResult>;

async bulkUpdate(objects: BulkUpdateItemDto[]): Promise<void>;

async bulkDelete(ids: string[]): Promise<void>;
```

### CrmObjectAssociationRepository

```typescript
// Already extends BaseCompanyRepository<CrmObjectAssociation>

// New methods needed:
async createAssociation(dto: CreateAssociationDto): Promise<CrmObjectAssociation>;

async getAssociationsForObject(
  objectId: string,
  typeId?: string,
): Promise<CrmObjectAssociation[]>;

async getAssociationsByType(
  typeId: string,
  query: PaginationQuery,
): Promise<{ data: CrmObjectAssociation[]; total: number }>;

async countAssociations(
  typeId: string,
  objectId: string,
  role: 'source' | 'target',
): Promise<number>;

async deleteAssociation(id: string): Promise<void>;

async deleteAssociationsForObject(objectId: string): Promise<void>;

async bulkCreateAssociations(associations: CreateAssociationDto[]): Promise<BulkResult>;

async bulkDeleteAssociations(ids: string[]): Promise<void>;
```

---

## 2.4 Database Indexes Needed

```sql
-- For efficient filtering by object type
CREATE INDEX idx_crm_objects_object_type ON "crm-objects" ("objectTypeId");

-- For search by displayName
CREATE INDEX idx_crm_objects_display_name ON "crm-objects" ("display_name");
CREATE INDEX idx_crm_objects_display_name_trgm ON "crm-objects" USING gin ("display_name" gin_trgm_ops);

-- For sorting by dates
CREATE INDEX idx_crm_objects_created_at ON "crm-objects" ("created_at" DESC);
CREATE INDEX idx_crm_objects_updated_at ON "crm-objects" ("updated_at" DESC);

-- For JSONB field queries (if needed)
CREATE INDEX idx_crm_objects_field_values ON "crm-objects" USING gin ("fieldValues");
```

---

# PHASE 3: Implementation Order

## Recommended Build Sequence

1. **DTOs First** - Create all request/response DTOs
2. **Repository Methods** - Implement CrmObjectRepository methods
3. **Field Validator Service** - Build validation logic per field type
4. **CrmObjectService** - Wire together validation + repository
5. **CrmObjectController** - Expose endpoints
6. **Association Repository** - Implement CrmObjectAssociationRepository
7. **Association Service** - Cardinality logic + bidirectional handling
8. **Association Controller** - Expose association endpoints
9. **Integration Tests** - Full flow tests

---

# Notes & Open Questions

| Item | Status | Notes |
|------|--------|-------|
| Protected field handling | TBD | May need to integrate with existing encryption service |
| Formula field calculation | TBD | Where does this logic live? Probably transform service |
| Field value indexing | TBD | Do we need JSONB path indexes for specific fields? |
| Soft delete for objects? | Decision needed | Currently hard delete cascades associations |
| Activity logging | TBD | Should we log all CRUD operations on objects? |
| Webhooks | TBD | Fire webhooks on object create/update/delete? |
