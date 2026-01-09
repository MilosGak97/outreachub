import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const DateField: FieldMetadata = {
  enumValue: FieldType.DATE,
  label: 'Date',
  description: 'Calendar date only',
  shape: {
    value: { type: 'string' },
  },
  configShape: {
    //minDate: { type: 'string', optional: true },   // ISO date string
    //maxDate: { type: 'string', optional: true },
    //disablePast: { type: 'boolean', optional: true },
    //timezone: { type: 'string', optional: true },
    //format: { type: 'string', optional: true },
  },
  isFormulaCapable: true,
  isUsableInFormula: true,
};
