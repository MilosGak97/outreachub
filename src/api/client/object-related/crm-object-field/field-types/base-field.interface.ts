import { FieldAction } from './field-action.enum';

export type FieldPrimitiveType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface FieldSchemaDefinition {
  type: FieldPrimitiveType;
  optional?: boolean;
  properties?: Record<string, FieldSchemaDefinition>; // for nested objects
  items?: FieldSchemaDefinition; // for arrays
}

export interface FieldMetadata {
  enumValue: string;
  label: string;
  description?: string;

  // Describes the value structure (e.g. phone fields, address fields)
  shape?: Record<string, FieldSchemaDefinition>;

  // Describes config schema (e.g. options for select, min/max for number)
  configShape?: Record<string, FieldSchemaDefinition>;
  actions?: FieldAction[]; // UI-based actions: CALL, EMAIL, etc.
  isFormulaCapable?: boolean;
  isUsableInFormula?: boolean;
}
