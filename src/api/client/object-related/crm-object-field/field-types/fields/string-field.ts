import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const StringField: FieldMetadata = {
  enumValue: FieldType.STRING,
  label: 'Text',
  description: 'Free-form text input',
  shape: {
    value: { type: 'string', optional: true },
  },
  configShape: {
    //minLength: { type: 'number', optional: true },
    //maxLength: { type: 'number', optional: true },
    //regex: { type: 'string', optional: true },
    //placeholder: { type: 'string', optional: true },
  },
  isFormulaCapable: true,
  isUsableInFormula: true,
};
