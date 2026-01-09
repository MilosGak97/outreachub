import { FieldType } from './field-type.enum';
import { StringField } from './fields/string-field';
import { NumberField } from './fields/number-field';
import { BooleanField } from './fields/boolean-field';
import { DateField } from './fields/date-field';
import { DatetimeField } from './fields/datetime-field';
import { JsonField } from './fields/json-field';
import { PhoneField } from './fields/phone-field';
import { EmailField } from './fields/email-field';
import { UrlField } from './fields/url-field';
import { TextareaField } from './fields/textarea-field';
import { SelectField } from './fields/select-field';
import { MultiSelectField } from './fields/multi-select-field';
import { CurrencyField } from './fields/currency-field';
import { FormulaField } from './fields/formula-field';


export const FieldRegistry = {
  [FieldType.STRING]: StringField,
  [FieldType.NUMBER]: NumberField,
  [FieldType.BOOLEAN]: BooleanField,
  [FieldType.DATE]: DateField,
  [FieldType.DATETIME]: DatetimeField,
  [FieldType.JSON]: JsonField,
  [FieldType.PHONE]: PhoneField,
  [FieldType.EMAIL]: EmailField,
  [FieldType.URL]: UrlField,
  [FieldType.TEXTAREA]: TextareaField,
  [FieldType.SELECT]: SelectField,
  [FieldType.MULTI_SELECT]: MultiSelectField,
  [FieldType.CURRENCY]: CurrencyField,
  [FieldType.FORMULA]: FormulaField,
};
