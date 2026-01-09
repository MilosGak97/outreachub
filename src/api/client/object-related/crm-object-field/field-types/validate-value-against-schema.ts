import { FieldSchemaDefinition } from './base-field.interface';
/**
 * validateValueAgainstSchema
 *
 * This function validates whether a given object matches a schema definition
 * defined using `FieldSchemaDefinition`. It supports primitive types, nested objects,
 * optional fields, and array validation.
 *
 * How it works:
 * - First, it checks if the input is a non-null object (not an array).
 * - It ensures there are no unexpected keys in the value that aren’t present in the schema.
 * - Then it iterates over all schema keys and:
 *    - Skips missing optional fields.
 *    - Throws an error if a required field is missing.
 *    - Validates primitive types (`string`, `number`, `boolean`) using `typeof`.
 *    - Recursively validates nested objects using the `properties` property.
 *    - For `array` types, it validates each item against the `items` schema recursively.
 * - Logs a clear warning and returns `false` for any invalid structure or mismatched types.
 * - Returns `true` only if all validations pass.
 *
 * This function can be used to validate both `shape` and `configShape` structures
 * in a unified and strict way.
 */
export function validateValueAgainstSchema(
  value: any,
  schema: Record<string, FieldSchemaDefinition>
): boolean {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    console.warn(`❌ Value must be a non-null object`);
    return false;
  }

  const valueKeys = Object.keys(value);

  // 🔍 Check for unexpected keys
  for (const key of valueKeys) {
    if (!(key in schema)) {
      console.warn(`❌ Unexpected key: ${key}`);
      return false;
    }
  }

  // ✅ Validate each expected key
  for (const [key, definition] of Object.entries(schema)) {
    const val = value[key];

    // Skip optional keys if missing
    if (val === undefined || val === null) {
      if (definition.optional) continue;
      console.warn(`❌ Missing required key: ${key}`);
      return false;
    }

    // Validate based on type
    switch (definition.type) {
      case 'string':
      case 'number':
      case 'boolean':
        if (typeof val !== definition.type) {
          console.warn(`❌ Invalid type for "${key}". Expected ${definition.type}, got ${typeof val}`);
          return false;
        }
        break;

      case 'object':
        if (typeof val !== 'object' || Array.isArray(val)) {
          console.warn(`❌ "${key}" must be a valid object`);
          return false;
        }
        if (definition.properties) {
          const valid = validateValueAgainstSchema(val, definition.properties);
          if (!valid) {
            console.warn(`❌ Invalid nested object in "${key}"`);
            return false;
          }
        }
        break;

      case 'array':
        if (!Array.isArray(val)) {
          console.warn(`❌ "${key}" must be an array`);
          return false;
        }
        if (definition.items) {
          for (let i = 0; i < val.length; i++) {
            const item = val[i];
            const tempWrapper = { temp: item };
            const tempSchema = { temp: definition.items };
            const valid = validateValueAgainstSchema(tempWrapper, tempSchema);
            if (!valid) {
              console.warn(`❌ Invalid item at index ${i} in array "${key}"`);
              return false;
            }
          }
        }
        break;

      default:
        console.warn(`❌ Unknown type "${definition.type}" for "${key}"`);
        return false;
    }
  }

  return true;
}
