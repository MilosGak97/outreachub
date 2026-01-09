# CRM Object Field Flow

This module handles CRUD for CRM object fields that belong to an object type. The implementation mixes **persisted attributes** (stored in `CrmObjectField` rows) with **type metadata** (kept in code-only `FieldMetadata` objects). The sections below call out where each piece lives.

## Create flow (`POST /crm-object-field`)
- Controller delegates to `CrmObjectFieldService.createField`.
- Repository validates the target object type and enforces company-unique `apiName` (scoped by `CompanyContext`).
- It instantiates a `CrmObjectField` entity with `name`, optional `description`, `fieldType`, optional `apiName`, optional `isRequired` (default false), and the parent `objectType`.
- If the request includes `shape` or `configShape`, each is validated against the static schema defined in `FieldRegistry[fieldType]` via `validateValueAgainstSchema`; invalid payloads throw `BadRequestException`.
- On success the entity is saved; `shape`/`configShape` are persisted as `jsonb` in the entity.

## Update flow (`PATCH /crm-object-field/:id`)
- Controller calls `CrmObjectFieldService.updateField`, which uses `CrmObjectFieldRepository.updateFieldById` to mutate `name`, `description`, and/or `isRequired` if provided.
- No schema validation is applied during update because `shape`/`configShape` are not currently updatable via this route.

## Listing fields (`GET /crm-object-field/:id/fields`)
- Guarded endpoint calls `CrmObjectFieldRepository.getFieldsByObjectType`, which scopes to company + object type, applies search/pagination, and returns `ObjectFieldDto` objects (id, name, apiName, description, isRequired, fieldType).

## Field type metadata (non-persisted)
- `FieldRegistry` in `field-types/index.ts` contains `FieldMetadata` per `FieldType`.
- `FieldMetadata` fields include:
  - `shape` and `configShape` schemas (validated and, if provided, stored on the entity).
  - `actions?: FieldAction[]` (e.g., CALL/EMAIL/TEXT/OPEN_LINK) – **used for UI hints only; not stored in the entity**.
  - `isFormulaCapable?: boolean` – whether a field type can generate formula values (e.g., `formula` field itself).
  - `isUsableInFormula?: boolean` – whether fields of this type can be referenced inside a formula tree.
- The `GET /crm-object-field/:type` endpoint surfaces `label`, `description`, and when defined, the `shape`/`configShape` schemas so the frontend can build field editors. Actions and formula flags remain internal.

## Persisted vs. metadata summary
- **Persisted per field instance** (`crm-object-fields` table): `name`, `description`, `fieldType`, `apiName`, `isRequired`, `shape`, `configShape`, plus company/objectType relations.
- **Code-only metadata per field type** (not stored per field): `actions`, `isFormulaCapable`, `isUsableInFormula`, labels, enum values, and default schemas.

## Should actions/isFormulaCapable be stored on the entity?
- Today these values are **type-level** and live only in `FieldRegistry`. Every field of a given `FieldType` implicitly inherits them, so persistence is not required unless you plan to override them per field instance.
- If you need to customize actions or formula usability per field, you would add nullable columns (e.g., `actions` as `jsonb`, `is_formula_capable`, `is_usable_in_formula` as booleans) to `CrmObjectField` and set them during create/update; otherwise the current design keeps them as static metadata.

## Formula capability notes
- `FieldType.FORMULA` is marked `isFormulaCapable: true` and `isUsableInFormula: true`; other types like `select` are `isFormulaCapable: false` but `isUsableInFormula: true` so they can be referenced in formulas.
- Formula `configShape` is stored as structured JSON: `category` (`math|string|date`), `expressionTree`, `dependsOnFields`, and `schemaVersion`. The backend only accepts `expressionTree` (no infix parsing) and validates the tree against the function palette before saving. Example payload:

  ```json
  {
    "category": "string",
    "expressionTree": {
      "function": "JOIN",
      "args": [
        { "literal": " " },
        { "field": "first_name" },
        { "field": "last_name" }
      ]
    }
  }
  ```

## Formula helper endpoint
- `GET /crm-object-field/formula/categories` (public): Returns supported formula categories as a string array (e.g. `["math","string","date"]`).
- `GET /crm-object-field/formula/category-to-functions` (public): Returns category → function-name lists for the builder UI (optional `?categories=math,string` filter).
- `GET /crm-object-field/formula/functions` (public): Returns function metadata (return type + arg signature) for validation and UX hints (optional `?category=string` and/or `?name=JOIN` filters).
- `GET /crm-object-field/formula/context/:objectTypeId` (auth): Returns formula-usable fields + derived `fieldTypes` mapping (`apiName -> primitive type`) for the target object type.
- `POST /crm-object-field/formula/normalize` (auth): Accepts `{ objectTypeId, category, expressionTree }` and returns `{ valid, errors, normalized }`. The backend derives `fieldTypes` from the object type's fields for validation.
- `PATCH /crm-object-field/:id/formula` (auth): Updates a formula field's `configShape` (normalizes + validates before saving).
- Use it to canonicalize and validate an `expressionTree`, and to collect `dependsOnFields` before saving.

## Formula Builder Flow (Recommended)

### 1) Load static builder metadata (public)
1. `GET /crm-object-field/formula/categories`
   - Use this to drive the category picker in the UI (`math | string | date`).
2. `GET /crm-object-field/formula/category-to-functions?categories=string`
   - Gives you the list of function names for a selected category.
3. `GET /crm-object-field/formula/functions?category=string`
   - Gives you each function’s `returnType` and `args` signature so the UI can guide the user.
   - Notes:
     - `optional: true` means the argument can be omitted.
     - `variadic: true` means that argument can repeat any number of times (e.g. `SUM(a,b,c,...)`, `CONCAT(a,b,c,...)`).
     - Function names are **full names only** (no aliases) and are normalized to **UPPERCASE**.

### 2) Load object-type context (auth)
4. `GET /crm-object-field/formula/context/:objectTypeId`
   - Use `fields` to render the “Fields” sidebar.
   - Use `fieldTypes` (`apiName -> primitiveType`) to validate field references client-side.
   - Important: when building a tree, reference fields by **`apiName`**, not by label.

### 3) Build an `expressionTree` (frontend state)
The backend accepts **expressionTree-only** (no infix parsing).

Supported node shapes:
- **Field node**: `{ "field": "api_name" }`
- **Literal node**: `{ "literal": "text" }`, `{ "literal": 123 }`, `{ "literal": true }`
- **Function node**: `{ "function": "JOIN", "args": [ ... ] }`

Notes:
- The root is typically a function node.
- The `category` is sent separately to `POST /formula/normalize`. The backend stamps the root with that category during normalization.

### 4) Validate/normalize while building (auth)
5. `POST /crm-object-field/formula/normalize`
   - Send `{ objectTypeId, category, expressionTree }`.
   - Use the response to power UI validation:
     - `valid` / `errors` → show errors next to the builder.
     - `normalized.dependsOnFields` → show dependencies.
     - `normalized.validation.inferredType` → can be used to type-check step results.

### 5) Save the formula field (auth)
6. `POST /crm-object-field` with `fieldType: "formula"`
   - Pass `configShape` as the **normalized config**:

  ```json
  {
    "name": "Full Name",
    "fieldType": "formula",
    "apiName": "full_name",
    "objectTypeId": "<objectTypeId>",
    "configShape": {
      "category": "string",
      "expressionTree": {
        "function": "JOIN",
        "args": [
          { "literal": " " },
          { "field": "first_name" },
          { "field": "last_name" }
        ]
      }
    }
  }
  ```

7. Updating an existing formula field:
   - `PATCH /crm-object-field/:id/formula` with `{ expressionTree, category? }`.
   - Backend re-validates and re-computes `dependsOnFields`.

## Step-Based Builder (Using “Result of Step N”)
You can support “temporary step results” in the UI **without any special backend node type**.

Recommended approach:
- Keep each step as its own `expressionTree` in frontend state.
- When the user selects **Result of Step N** in a later step, insert the *entire* step-N tree as the argument node (deep-clone it).
- The final formula you send to the backend is just the **last step’s** tree, with previous steps already nested.

This keeps the backend simple and guarantees the backend sees a single valid tree.

### Example A (Math): step1 → step2 (round) → step3 (+ field)
**Step 1**: `MULTIPLY(number, number2)`
```json
{
  "function": "MULTIPLY",
  "args": [{ "field": "number" }, { "field": "number2" }]
}
```

**Step 2**: `ROUND(resultOfStep1, 2)`
```json
{
  "function": "ROUND",
  "args": [
    { "function": "MULTIPLY", "args": [{ "field": "number" }, { "field": "number2" }] },
    { "literal": 2 }
  ]
}
```

**Step 3**: `SUM(resultOfStep2, number3)` → this is the **final** tree you send
```json
{
  "function": "SUM",
  "args": [
    {
      "function": "ROUND",
      "args": [
        {
          "function": "MULTIPLY",
          "args": [{ "field": "number" }, { "field": "number2" }]
        },
        { "literal": 2 }
      ]
    },
    { "field": "number3" }
  ]
}
```

Normalize it with:
```json
{
  "objectTypeId": "<objectTypeId>",
  "category": "math",
  "expressionTree": { "...the Step 3 tree above..." }
}
```

### Example B (String): join → upper → concat
Final tree:
```json
{
  "function": "CONCAT",
  "args": [
    {
      "function": "UPPER",
      "args": [
        {
          "function": "JOIN",
          "args": [
            { "literal": " - " },
            { "field": "first_name" },
            { "field": "last_name" }
          ]
        }
      ]
    },
    { "literal": " (VIP)" }
  ]
}
```

Normalize with `category: "string"`.

### Example C (Date): add days → format
Final tree:
```json
{
  "function": "FORMAT_DATE",
  "args": [
    { "function": "ADD_DAYS", "args": [{ "field": "created_at" }, { "literal": 7 }] },
    { "literal": "YYYY-MM-DD" }
  ]
}
```

Normalize with `category: "date"`.
