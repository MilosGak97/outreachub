// field-type.enum.ts
export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  JSON = 'json',

  // Smart/structured types
  PHONE = 'phone',
  EMAIL = 'email',
  URL = 'url',
  ADDRESS = 'address',

  // UI/extended types
  TEXTAREA = 'textarea',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  CURRENCY = 'currency',

  // Formula-driven
  FORMULA = 'formula',
  PROTECTED_PHONE = 'protected_phone',
  PROTECTED_EMAIL = 'protected_email',
  PROTECTED_ADDRESS = 'protected_address',
}
