import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';
import { FieldAction } from '../field-action.enum';

export const PhoneField: FieldMetadata = {
  enumValue: FieldType.PHONE,
  label: 'Phone Number',
  description: 'Structured phone input for calling/SMS',
  shape: {
    //name: { type: 'string' },
    code: { type: 'string' },
    //flag: { type: 'string' },
    //prefix: { type: 'string' },
    number: { type: 'string' },
  },
  actions: [FieldAction.CALL, FieldAction.TEXT],
  isFormulaCapable: false,
  isUsableInFormula: false,
};
