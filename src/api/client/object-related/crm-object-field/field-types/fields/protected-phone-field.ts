import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';
import { FieldAction } from '../field-action.enum';

export const ProtectedPhoneField: FieldMetadata = {
  enumValue: FieldType.PROTECTED_PHONE,
  label: 'Protected Phone Number',
  description: 'Phone stored in the protected vault; frontend only sees masked label.',
  shape: {
    protectedValueId: { type: 'string' },
  },
  configShape: {
    allowedActions: { type: 'array', items: { type: 'string' } },
    maskingStyle: { type: 'string' },
    revealable: { type: 'boolean' },
    countryCode: { type: 'string' },
  },
  isProtected: true,
  storageType: 'protected_value',
  protectedValueType: 'phone',
  actions: [FieldAction.CALL, FieldAction.TEXT],
};
