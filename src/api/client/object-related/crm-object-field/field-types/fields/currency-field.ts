import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const CurrencyField: FieldMetadata = {
  enumValue: FieldType.CURRENCY,
  label: 'Currency',
  description: 'Financial values (e.g., USD, EUR)',
  shape: {
    value: { type: 'string' },
  },
  isFormulaCapable: true,
  isUsableInFormula: true,
};
