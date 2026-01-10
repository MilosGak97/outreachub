import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const ProtectedAddressField: FieldMetadata = {
  enumValue: FieldType.PROTECTED_ADDRESS,
  label: 'Protected Address',
  description: 'Address stored in a secure vault; only masked info is shared.',
  shape: {
    protectedValueId: { type: 'string' },
  },
  configShape: {
    allowedActions: { type: 'array', items: { type: 'string' } },
    maskingStyle: { type: 'string' },
    revealable: { type: 'boolean' },
    addressFormat: { type: 'string' },
  },
  isProtected: true,
  storageType: 'protected_value',
  protectedValueType: 'address',
};
