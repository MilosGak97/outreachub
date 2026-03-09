import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const AddressField: FieldMetadata = {
  enumValue: FieldType.ADDRESS,
  label: 'Address',
  description: 'Structured address input',
  shape: {
    street: { type: 'string', optional: true },
    city: { type: 'string', optional: true },
    state: { type: 'string', optional: true },
    zip: { type: 'string', optional: true },
    country: { type: 'string', optional: true },
  },
  isFormulaCapable: false,
  isUsableInFormula: false,
};
