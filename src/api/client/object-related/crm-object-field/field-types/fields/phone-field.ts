import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';
import { FieldAction } from '../field-action.enum';

export const PhoneField: FieldMetadata = {
  enumValue: FieldType.PHONE,
  label: 'Phone Number',
  description: 'Structured phone input for calling/SMS',
  shape: {
    code: { type: 'string' },
    number: { type: 'string' },
  },
  actions: [FieldAction.CALL, FieldAction.TEXT],
  isFormulaCapable: false,
  isUsableInFormula: false,
};
