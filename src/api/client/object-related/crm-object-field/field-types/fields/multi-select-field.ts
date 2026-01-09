import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const MultiSelectField: FieldMetadata = {
  enumValue: FieldType.MULTI_SELECT,
  label: 'Multi Select',
  description: 'Multiple choice selection',
  shape: {
    // this is the array of selected `value` strings
    value: {
      type:  'array',
      items: { type: 'string' },
    },
  },
  configShape: {
    options: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          value: { type: 'string' },
        },
      },
    },
    allowSearch: { type: 'boolean', optional: true },
  },
  isFormulaCapable: false,
  isUsableInFormula: false,
};
