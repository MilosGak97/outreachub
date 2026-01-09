import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const NumberField: FieldMetadata = {
  enumValue: FieldType.NUMBER,
  label: 'Number',
  description: 'Numeric value (integer or decimal)',
  shape: {
    value: { type: 'number' },
  },
  configShape: {
    //min: { type: 'number', optional: true },
    //max: { type: 'number', optional: true },
    //step: { type: 'number', optional: true },
    //decimalPlaces: { type: 'number', optional: true },
  },
  isFormulaCapable: true,
  isUsableInFormula: true,
};