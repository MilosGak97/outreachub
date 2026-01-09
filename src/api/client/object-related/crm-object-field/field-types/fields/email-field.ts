import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';
import { FieldAction } from '../field-action.enum';

export const EmailField: FieldMetadata = {
  enumValue: FieldType.EMAIL,
  label: 'Email Address',
  description: 'Used for email campaigns and user contact',
  shape: {
    email: { type: 'string' },
  },
  actions: [FieldAction.EMAIL],
  isFormulaCapable: false,
  isUsableInFormula: false,
};
