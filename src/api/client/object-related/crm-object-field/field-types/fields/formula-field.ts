import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const FormulaField: FieldMetadata = {
  enumValue: FieldType.FORMULA,
  label: 'Formula Field',
  description: 'Calculated field using other fields',
  shape: {}, // Computed; output varies by category
  configShape: {
    category: { type: 'string', optional: true },
    expressionTree: { type: 'object' },
    dependsOnFields: {
      type: 'array',
      optional: true,
      items: { type: 'string' },
    },
    schemaVersion: { type: 'number', optional: true },
  },
  isFormulaCapable: true,
  isUsableInFormula: true,
};
