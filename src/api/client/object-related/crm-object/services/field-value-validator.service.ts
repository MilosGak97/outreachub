import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CrmObjectFieldRepository } from '../../../../repositories/postgres/object/crm-object-field.repository';
import { CrmObjectField } from '../../../../entities/object/crm-object-field.entity';
import { FieldType } from '../../crm-object-field/field-types/field-type.enum';
import { FieldRegistry } from '../../crm-object-field/field-types';
import { validateValueAgainstSchema } from '../../crm-object-field/field-types/validate-value-against-schema';

export interface FieldValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: FieldValidationError[];
  sanitizedValues: Record<string, any>;
}

@Injectable()
export class FieldValueValidatorService {
  constructor(
    private readonly fieldRepository: CrmObjectFieldRepository,
  ) {}

  async validateFieldValues(
    objectTypeId: string,
    fieldValues: Record<string, any> | undefined,
    isCreate: boolean,
  ): Promise<ValidationResult> {
    const errors: FieldValidationError[] = [];
    const sanitizedValues: Record<string, any> = {};

    // Load field definitions for the object type
    const fields = await this.fieldRepository.find({
      where: { objectType: { id: objectTypeId } },
    });

    if (fields.length === 0 && isCreate) {
      // No fields defined, just return empty values
      return { valid: true, errors: [], sanitizedValues: fieldValues || {} };
    }

    const fieldMap = new Map<string, CrmObjectField>();
    for (const field of fields) {
      if (field.apiName) {
        fieldMap.set(field.apiName, field);
      }
    }

    // Check required fields on create
    if (isCreate) {
      for (const field of fields) {
        if (field.isRequired && field.apiName) {
          const value = fieldValues?.[field.apiName];
          if (value === undefined || value === null || value === '') {
            errors.push({
              field: field.apiName,
              message: `Required field "${field.name}" is missing`,
            });
          }
        }
      }
    }

    // Validate each provided field value
    if (fieldValues) {
      for (const [apiName, value] of Object.entries(fieldValues)) {
        const field = fieldMap.get(apiName);

        if (!field) {
          // Unknown field - skip or error based on strict mode
          // For flexibility, we'll skip unknown fields
          continue;
        }

        // Skip null/undefined values (they clear the field)
        if (value === null || value === undefined) {
          sanitizedValues[apiName] = null;
          continue;
        }

        // Validate based on field type
        const validationResult = this.validateFieldValue(value, field);

        if (!validationResult.valid) {
          errors.push({
            field: apiName,
            message: validationResult.error || `Invalid value for field "${field.name}"`,
          });
        } else {
          sanitizedValues[apiName] = validationResult.sanitizedValue ?? value;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedValues,
    };
  }

  private validateFieldValue(
    value: any,
    field: CrmObjectField,
  ): { valid: boolean; error?: string; sanitizedValue?: any } {
    const fieldType = field.fieldType;

    switch (fieldType) {
      case FieldType.STRING:
      case FieldType.TEXTAREA:
        return this.validateString(value);

      case FieldType.NUMBER:
        return this.validateNumber(value, field);

      case FieldType.BOOLEAN:
        return this.validateBoolean(value);

      case FieldType.DATE:
        return this.validateDate(value);

      case FieldType.DATETIME:
        return this.validateDateTime(value);

      case FieldType.EMAIL:
        return this.validateEmail(value);

      case FieldType.URL:
        return this.validateUrl(value);

      case FieldType.PHONE:
        return this.validatePhone(value, field);

      case FieldType.SELECT:
        return this.validateSelect(value, field);

      case FieldType.MULTI_SELECT:
        return this.validateMultiSelect(value, field);

      case FieldType.CURRENCY:
        return this.validateCurrency(value, field);

      case FieldType.JSON:
        return this.validateJson(value);

      case FieldType.ADDRESS:
        return this.validateAddress(value, field);

      case FieldType.FORMULA:
        // Formula fields are calculated, not stored
        return { valid: false, error: 'Formula fields cannot be set directly' };

      case FieldType.PROTECTED_PHONE:
      case FieldType.PROTECTED_EMAIL:
      case FieldType.PROTECTED_ADDRESS:
        // Protected fields need special handling
        return this.validateProtectedField(value, field);

      default:
        // Unknown field type - accept any value
        return { valid: true, sanitizedValue: value };
    }
  }

  private validateString(value: any): { valid: boolean; error?: string; sanitizedValue?: any } {
    if (typeof value !== 'string') {
      return { valid: false, error: 'Value must be a string' };
    }
    return { valid: true, sanitizedValue: value };
  }

  private validateNumber(value: any, field: CrmObjectField): { valid: boolean; error?: string; sanitizedValue?: any } {
    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (typeof num !== 'number' || isNaN(num)) {
      return { valid: false, error: 'Value must be a number' };
    }

    // Check min/max from configShape if defined
    const config = field.configShape as { min?: number; max?: number } | undefined;
    if (config?.min !== undefined && num < config.min) {
      return { valid: false, error: `Value must be at least ${config.min}` };
    }
    if (config?.max !== undefined && num > config.max) {
      return { valid: false, error: `Value must be at most ${config.max}` };
    }

    return { valid: true, sanitizedValue: num };
  }

  private validateBoolean(value: any): { valid: boolean; error?: string; sanitizedValue?: any } {
    if (typeof value === 'boolean') {
      return { valid: true, sanitizedValue: value };
    }
    if (value === 'true' || value === '1' || value === 1) {
      return { valid: true, sanitizedValue: true };
    }
    if (value === 'false' || value === '0' || value === 0) {
      return { valid: true, sanitizedValue: false };
    }
    return { valid: false, error: 'Value must be a boolean' };
  }

  private validateDate(value: any): { valid: boolean; error?: string; sanitizedValue?: any } {
    if (typeof value !== 'string') {
      return { valid: false, error: 'Date must be a string in ISO format' };
    }

    // Check if it's a valid date string
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid date format' };
    }

    // Return as ISO date string (YYYY-MM-DD)
    return { valid: true, sanitizedValue: date.toISOString().split('T')[0] };
  }

  private validateDateTime(value: any): { valid: boolean; error?: string; sanitizedValue?: any } {
    if (typeof value !== 'string') {
      return { valid: false, error: 'DateTime must be a string in ISO format' };
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'Invalid datetime format' };
    }

    return { valid: true, sanitizedValue: date.toISOString() };
  }

  private validateEmail(value: any): { valid: boolean; error?: string; sanitizedValue?: any } {
    if (typeof value !== 'string') {
      return { valid: false, error: 'Email must be a string' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true, sanitizedValue: value.toLowerCase() };
  }

  private validateUrl(value: any): { valid: boolean; error?: string; sanitizedValue?: any } {
    if (typeof value !== 'string') {
      return { valid: false, error: 'URL must be a string' };
    }

    try {
      new URL(value);
      return { valid: true, sanitizedValue: value };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  private validatePhone(value: any, field: CrmObjectField): { valid: boolean; error?: string; sanitizedValue?: any } {
    // Phone field expects: { code: string, number: string }
    if (typeof value !== 'object' || value === null) {
      return { valid: false, error: 'Phone must be an object with code and number' };
    }

    const fieldDef = FieldRegistry[FieldType.PHONE];
    if (fieldDef?.shape) {
      const isValid = validateValueAgainstSchema(value, fieldDef.shape);
      if (!isValid) {
        return { valid: false, error: 'Invalid phone structure' };
      }
    }

    return { valid: true, sanitizedValue: value };
  }

  private validateSelect(value: any, field: CrmObjectField): { valid: boolean; error?: string; sanitizedValue?: any } {
    // Value can be string or object with 'value' property
    let selectValue: string;

    if (typeof value === 'string') {
      selectValue = value;
    } else if (typeof value === 'object' && value?.value) {
      selectValue = value.value;
    } else {
      return { valid: false, error: 'Select value must be a string or object with value property' };
    }

    // Validate against options if defined
    const config = field.configShape as { options?: Array<{ value: string }> } | undefined;
    if (config?.options) {
      const validValues = config.options.map(opt => opt.value);
      if (!validValues.includes(selectValue)) {
        return { valid: false, error: `Invalid option. Must be one of: ${validValues.join(', ')}` };
      }
    }

    return { valid: true, sanitizedValue: { value: selectValue } };
  }

  private validateMultiSelect(value: any, field: CrmObjectField): { valid: boolean; error?: string; sanitizedValue?: any } {
    if (!Array.isArray(value)) {
      return { valid: false, error: 'Multi-select value must be an array' };
    }

    const config = field.configShape as { options?: Array<{ value: string }> } | undefined;
    const validValues = config?.options?.map(opt => opt.value) || [];

    const sanitizedValues: string[] = [];
    for (const item of value) {
      let itemValue: string;
      if (typeof item === 'string') {
        itemValue = item;
      } else if (typeof item === 'object' && item?.value) {
        itemValue = item.value;
      } else {
        return { valid: false, error: 'Each multi-select item must be a string or object with value' };
      }

      if (validValues.length > 0 && !validValues.includes(itemValue)) {
        return { valid: false, error: `Invalid option "${itemValue}"` };
      }

      sanitizedValues.push(itemValue);
    }

    return { valid: true, sanitizedValue: sanitizedValues.map(v => ({ value: v })) };
  }

  private validateCurrency(value: any, field: CrmObjectField): { valid: boolean; error?: string; sanitizedValue?: any } {
    if (typeof value !== 'object' || value === null) {
      // If it's just a number, wrap it with default currency
      if (typeof value === 'number') {
        return { valid: true, sanitizedValue: { amount: value, currency: 'USD' } };
      }
      return { valid: false, error: 'Currency must be an object with amount and currency' };
    }

    if (typeof value.amount !== 'number') {
      return { valid: false, error: 'Currency amount must be a number' };
    }

    return {
      valid: true,
      sanitizedValue: {
        amount: value.amount,
        currency: value.currency || 'USD',
      },
    };
  }

  private validateJson(value: any): { valid: boolean; error?: string; sanitizedValue?: any } {
    if (typeof value === 'object') {
      return { valid: true, sanitizedValue: value };
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return { valid: true, sanitizedValue: parsed };
      } catch {
        return { valid: false, error: 'Invalid JSON format' };
      }
    }

    return { valid: false, error: 'JSON value must be an object or valid JSON string' };
  }

  private validateAddress(value: any, field: CrmObjectField): { valid: boolean; error?: string; sanitizedValue?: any } {
    if (typeof value !== 'object' || value === null) {
      return { valid: false, error: 'Address must be an object' };
    }

    // Basic address validation
    const sanitized: Record<string, any> = {};

    if (value.street !== undefined) sanitized.street = String(value.street);
    if (value.city !== undefined) sanitized.city = String(value.city);
    if (value.state !== undefined) sanitized.state = String(value.state);
    if (value.zip !== undefined) sanitized.zip = String(value.zip);
    if (value.country !== undefined) sanitized.country = String(value.country);

    return { valid: true, sanitizedValue: sanitized };
  }

  private validateProtectedField(value: any, field: CrmObjectField): { valid: boolean; error?: string; sanitizedValue?: any } {
    // Protected fields have their own validation in the ingestion service
    // Here we just do basic type checking based on the underlying type

    switch (field.fieldType) {
      case FieldType.PROTECTED_EMAIL:
        return this.validateEmail(value);

      case FieldType.PROTECTED_PHONE:
        return this.validatePhone(value, field);

      case FieldType.PROTECTED_ADDRESS:
        return this.validateAddress(value, field);

      default:
        return { valid: true, sanitizedValue: value };
    }
  }
}
