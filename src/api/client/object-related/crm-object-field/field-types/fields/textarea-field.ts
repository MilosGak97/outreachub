import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const TextareaField: FieldMetadata = {
  enumValue: FieldType.TEXTAREA,
  label: 'Long Text',
  description: 'Multi-line input',
  shape: {
    value: { type: 'string' },
  },
  configShape: {},
  isFormulaCapable: false,
  isUsableInFormula: false,
};
