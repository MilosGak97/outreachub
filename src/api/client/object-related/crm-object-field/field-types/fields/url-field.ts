import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';
import { FieldAction } from '../field-action.enum';

export const UrlField: FieldMetadata = {
  enumValue: FieldType.URL,
  label: 'Website / Link',
  description: 'Any HTTP or HTTPS link',
  shape: {
    value: { type: 'string' },
  },
  configShape: {},
  actions: [FieldAction.OPEN_LINK],
  isFormulaCapable: false,
  isUsableInFormula: false,
};
