# Object-related (Client)

ObjectRelatedModule bundles the CRM customization surface (object types, fields, associations, and runtime objects) that is exposed in the Client API Swagger. Most endpoints sit behind `UserAuthGuard` (user JWT), which also sets the company context so repositories transparently scope queries to the caller's company.

## Entities at a glance
- `CrmObjectType`: Name, `apiName`, and optional description for a given company; owns `fields` and `objects`.
- `CrmObjectField`: Belongs to an object type and company; has `fieldType` (see `FieldType` enum), optional `description`, optional `shape`/`configShape`, and a company-unique `apiName`.
- `CrmObject`: Instance of an object type with `displayName` and dynamic `fieldValues` JSON; belongs to a company and may participate in associations.
- `CrmAssociationType`: Defines how two object types relate (endpoints + cardinality); stores `sourceObjectType`, `targetObjectType`, `sourceCardinality`, `targetCardinality`, `apiName`, `isBidirectional`, and optional `reverseName`/`description`.
- `CrmObjectAssociation`: Concrete link between two objects under a company and an association type; optional `metadata` JSON and `reverseOf` link.

## Field types
- Supported enum values: `string`, `number`, `boolean`, `date`, `datetime`, `json`, `phone`, `email`, `url`, `textarea`, `select`, `multi_select`, `currency`, `formula`, `address`.
- `GET /crm-object-field` returns the enum list; `GET /crm-object-field/:type` returns label and description metadata. These two endpoints are public (no guard) and power the field-builder UI.

## API surface
### CRM Object Types (`/crm-object-type`, guard: `UserAuthGuard`)
| Method & Path | Body | Response | Notes |
| --- | --- | --- | --- |
| GET `/` | Query: `limit` (required), `offset` (required), `searchQuery` (optional), `associationCheck` (optional) | `GetAllObjectsResponseDto` | Paginates object types scoped to the caller's company; `associationCheck` excludes types already associated with the provided object type id. |
| POST `/` | `CreateCrmObjectTypeDto` | `string` (new id) | Validates `apiName` snake_case and uniqueness per company. |
| GET `/:id` | – | `GetSingleObjectTypeDto` | 404 if id is missing. |
| GET `/api-name/:value` | – | `boolean` | Returns availability for the requested `apiName` (also validates snake_case). |
| PATCH `/:id` | `UpdateCrmObjectTypeDto` | `{ message }` | Updates `name` and/or `description`. |
| DELETE `/:id` | – | `{ message }` | Removes the object type. |

### CRM Object Fields (`/crm-object-field`)
| Method & Path | Auth | Body | Response | Notes |
| --- | --- | --- | --- | --- |
| GET `/` | none | – | `{ types: FieldType[] }` | Supported field types (no guard). |
| GET `/:type` | none | – | `FieldTypeDefinitionDto` | Metadata for a specific field type (label/description + shape/configShape schemas when defined). |
| POST `/` | `UserAuthGuard` | `CreateCrmObjectFieldDto` | `CrmObjectField` | Validates target `objectTypeId`, `shape`, `configShape`, and `apiName` uniqueness. |
| GET `/formula/categories` | none | – | `FormulaCategory[]` | Supported formula categories. |
| GET `/formula/category-to-functions` | none | Query: optional `categories` array | `{ math?, string?, date? }` | Category → function-name lists (supports `?categories=math,string`). |
| GET `/formula/functions` | none | Query: optional `category`, optional `name` | `FormulaFunctionDefinitionDto[]` | Function metadata (return type + arg signature). |
| GET `/formula/context/:objectTypeId` | `UserAuthGuard` | – | `{ objectTypeId, fields, fieldTypes }` | Formula-usable fields + derived primitive type hints for validation. |
| POST `/formula/normalize` | `UserAuthGuard` | `NormalizeFormulaDto` | `{ valid, errors, normalized }` | Normalizes + validates an `expressionTree` (requires `objectTypeId` for field/type validation). |
| PATCH `/:id/formula` | `UserAuthGuard` | `UpdateFormulaConfigDto` | `CrmObjectField` | Updates a formula field's `configShape` (expressionTree-only; normalizes + validates before saving). |
| PATCH `/:id` | `UserAuthGuard` | `UpdateCrmObjectFieldDto` | `{ message }` | Updates `name`/`description`/`isRequired`. |
| DELETE `/:id` | `UserAuthGuard` | – | `{ message }` | 404 if the field is missing. |
| GET `/:id/fields` | `UserAuthGuard` | Query: `limit`, `offset`, optional `searchQuery` | Paged list shaped like `ObjectFieldDto` | Returns fields for the given object type within the caller's company. |

### CRM Association Types (`/crm-association-type`, guard: `UserAuthGuard`)
| Method & Path | Body | Response | Notes |
| --- | --- | --- | --- |
| GET `/` | Query: `limit` (required), `offset` (required), optional `searchQuery`, optional `objectTypeId` | `GetAllAssociationTypesResponseDto` | Paginates association types scoped to the caller's company (joins in source/target type names). |
| POST `/` | `CreateCrmAssociationTypeDto` | `string` (new id) | Validates endpoints exist in the company; self-associations are rejected. |
| GET `/:id` | – | `GetSingleAssociationTypeDto` | 404 if id is missing. |
| GET `/api-name/:value` | – | `boolean` | Returns availability for the requested `apiName` (also validates snake_case). |
| PATCH `/:id` | `UpdateCrmAssociationTypeDto` | `{ message }` | Updates labels/description/cardinality (tightening to `ONE` is blocked if existing associations violate it). |
| DELETE `/:id` | – | `{ message }` | Blocked while any `CrmObjectAssociation` rows exist for the type. |

## Multi-tenant behavior
- `UserAuthGuard` attaches `companyId` to the CLS context; `CompanyContext` reads it and `BaseCompanyRepository` automatically applies it across `find*`, `existsBy`, `update`, and `delete` calls.
- Repository `create` also injects the current company, so callers never pass `companyId` manually.

## Pending surfaces
- `crm-object` and `crm-object-association` modules are wired into `ObjectRelatedModule` but their controllers/services currently expose no routes.

## Swagger
- `ObjectRelatedModule` is included in the Client API Swagger (`/client` UI and `/client/api-json`), so these endpoints appear alongside other client routes.
