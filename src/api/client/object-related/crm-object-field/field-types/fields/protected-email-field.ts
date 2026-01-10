import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';
import { FieldAction } from '../field-action.enum';

export const ProtectedEmailField: FieldMetadata = {
  enumValue: FieldType.PROTECTED_EMAIL,
  label: 'Protected Email',
  description: 'Email stored as an encrypted protected value.',
  shape: {
    protectedValueId: { type: 'string' },
  },
  configShape: {
    allowedActions: { type: 'array', items: { type: 'string' } },
    maskingStyle: { type: 'string' },
    revealable: { type: 'boolean' },
  },
  isProtected: true,
  storageType: 'protected_value',
  protectedValueType: 'email',
  actions: [FieldAction.EMAIL],
};
