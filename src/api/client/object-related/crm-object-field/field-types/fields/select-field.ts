import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const SelectField: FieldMetadata = {
  enumValue: FieldType.SELECT,
  label: 'Dropdown Select',
  description: 'Choose a single option',

  shape: {
    value: { type: 'string' },
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
  isUsableInFormula: true,
};
