import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const BooleanField: FieldMetadata = {
  enumValue: FieldType.BOOLEAN,
  label: 'Yes / No',
  description: 'True or false toggle',
  shape: {
    value: { type: 'boolean' },
  },
  configShape: {
   // labelTrue: { type: 'string', optional: true },
   // labelFalse: { type: 'string', optional: true },
   // defaultValue: { type: 'boolean', optional: true },
  },
  isFormulaCapable: false,
  isUsableInFormula: true,
};
