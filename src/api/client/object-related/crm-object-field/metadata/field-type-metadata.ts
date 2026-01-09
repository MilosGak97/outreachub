import { FieldType } from '../field-types/field-type.enum';


export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  [FieldType.STRING]: 'Short Text',
  [FieldType.NUMBER]: 'Number',
  [FieldType.BOOLEAN]: 'Checkbox',
  [FieldType.DATE]: 'Date',
  [FieldType.DATETIME]: 'Date & Time',
  [FieldType.JSON]: 'JSON Object',
  [FieldType.PHONE]: 'Phone Number',
  [FieldType.EMAIL]: 'Email Address',
  [FieldType.URL]: 'URL Link',
  [FieldType.TEXTAREA]: 'Long Text',
  [FieldType.SELECT]: 'Dropdown',
  [FieldType.MULTI_SELECT]: 'Multi Select',
  [FieldType.CURRENCY]: 'Currency',
  [FieldType.FORMULA]: 'Formula Field',
  [FieldType.ADDRESS]: 'Address',
};



export const FIELD_TYPE_DESCRIPTIONS: Record<FieldType, string> = {
  [FieldType.STRING]: 'A basic single-line text field.',
  [FieldType.NUMBER]: 'Numeric value field.',
  [FieldType.BOOLEAN]: 'True/false checkbox field.',
  [FieldType.DATE]: 'Stores a date value.',
  [FieldType.DATETIME]: 'Stores a date and time.',
  [FieldType.JSON]: 'Stores a JSON structure.',
  [FieldType.PHONE]: 'Validated phone number field.',
  [FieldType.EMAIL]: 'Validated email address field.',
  [FieldType.URL]: 'Validated website link.',
  [FieldType.TEXTAREA]: 'Multi-line text input.',
  [FieldType.SELECT]: 'Dropdown with predefined options.',
  [FieldType.MULTI_SELECT]: 'Field allowing selection of multiple options.',
  [FieldType.CURRENCY]: 'Monetary value.',
  [FieldType.FORMULA]: 'Computed field based on formula.',
  [FieldType.ADDRESS]: 'Address',
};