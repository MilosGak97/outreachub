import { FieldMetadata } from '../base-field.interface';
import { FieldType } from '../field-type.enum';

export const JsonField: FieldMetadata = {
  enumValue: FieldType.JSON,
  label: 'Raw JSON',
  description: 'Unstructured JSON payload',
  shape: {},
  isFormulaCapable: false,
  isUsableInFormula: false,
};
