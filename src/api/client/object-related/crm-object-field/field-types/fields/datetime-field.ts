import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const DatetimeField: FieldMetadata = {
  enumValue: FieldType.DATETIME,
  label: 'Date & Time',
  description: 'Combined date and time',
  shape: {
    value: { type: 'string' },
  },
  isFormulaCapable: true,
  isUsableInFormula: true,
};
