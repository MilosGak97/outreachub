import { BadRequestException } from '@nestjs/common';
import { FieldRegistry } from './index';
import { FieldType } from './field-type.enum';
import { PrimitiveValueType } from '../formula/primitive-value-type.enum';
import { normalizeFormulaConfig } from '../formula/normalize-formula-config';
import { validateValueAgainstSchema } from './validate-value-against-schema';
import { FieldSchemaDefinition } from './base-field.interface';

export interface FieldConfigValidationInput {
  fieldType: FieldType;
  shape?: Record<string, any>;
  configShape?: Record<string, any>;
  formulaFieldTypes?: Record<string, PrimitiveValueType>;
}

export interface FieldConfigValidationResult {
  normalizedConfigShape?: Record<string, any>;
  normalizedShape?: Record<string, FieldSchemaDefinition>;
}

type JsonSchema = {
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
};

const SUPPORTED_SCHEMA_TYPES = new Set(['string', 'number', 'boolean', 'object', 'array', 'integer']);

const normalizeSchemaType = (type?: string): FieldSchemaDefinition['type'] | null => {
  if (!type || !SUPPORTED_SCHEMA_TYPES.has(type)) return null;
  if (type === 'integer') return 'number';
  return type as FieldSchemaDefinition['type'];
};

const isFieldSchemaDefinition = (value: unknown): value is FieldSchemaDefinition => {
  if (!value || typeof value !== 'object') return false;
  const type = (value as { type?: string }).type;
  return typeof type === 'string' && normalizeSchemaType(type) !== null;
};

const isSchemaMap = (value: Record<string, any>): boolean => {
  const entries = Object.values(value);
  return entries.length > 0 && entries.every((entry) => isFieldSchemaDefinition(entry));
};

const toFieldSchemaDefinition = (schema: JsonSchema): FieldSchemaDefinition | null => {
  const normalizedType = normalizeSchemaType(schema.type);
  if (!normalizedType) return null;

  const definition: FieldSchemaDefinition = { type: normalizedType };

  if (normalizedType === 'object') {
    const properties = schema.properties ?? {};
    const required = new Set(schema.required ?? []);
    const mapped: Record<string, FieldSchemaDefinition> = {};

    for (const [key, value] of Object.entries(properties)) {
      const child = toFieldSchemaDefinition(value);
      if (!child) return null;
      if (!required.has(key)) {
        child.optional = true;
      }
      mapped[key] = child;
    }

    definition.properties = mapped;
  }

  if (normalizedType === 'array') {
    if (!schema.items) return null;
    const itemDef = toFieldSchemaDefinition(schema.items);
    if (!itemDef) return null;
    definition.items = itemDef;
  }

  return definition;
};

const normalizeShapeSchema = (
  shape: Record<string, any>,
): Record<string, FieldSchemaDefinition> | null => {
  if (shape.type === 'object' && typeof shape.properties === 'object') {
    const normalized = toFieldSchemaDefinition(shape as JsonSchema);
    if (!normalized || normalized.type !== 'object' || !normalized.properties) {
      return null;
    }
    return normalized.properties;
  }

  if (isSchemaMap(shape)) {
    return shape as Record<string, FieldSchemaDefinition>;
  }

  return null;
};

const isSchemaCompatible = (
  input: Record<string, FieldSchemaDefinition>,
  expected: Record<string, FieldSchemaDefinition>,
): boolean => {
  const inputKeys = Object.keys(input);
  const expectedKeys = Object.keys(expected);

  if (inputKeys.length !== expectedKeys.length) return false;
  for (const key of expectedKeys) {
    if (!input[key]) return false;
    if (!isDefinitionCompatible(input[key], expected[key])) return false;
  }

  return true;
};

const isDefinitionCompatible = (
  input: FieldSchemaDefinition,
  expected: FieldSchemaDefinition,
): boolean => {
  const inputType = normalizeSchemaType(input.type);
  const expectedType = normalizeSchemaType(expected.type);
  if (!inputType || !expectedType || inputType !== expectedType) return false;

  const inputOptional = input.optional === true;
  const expectedOptional = expected.optional === true;
  if (inputOptional !== expectedOptional) return false;

  if (expectedType === 'object') {
    const inputProps = input.properties ?? {};
    const expectedProps = expected.properties ?? {};
    return isSchemaCompatible(inputProps, expectedProps);
  }

  if (expectedType === 'array') {
    if (!input.items || !expected.items) return false;
    return isDefinitionCompatible(input.items, expected.items);
  }

  return true;
};

export function validateAndNormalizeFieldConfig(
  input: FieldConfigValidationInput,
): FieldConfigValidationResult {
  const { fieldType, shape, configShape, formulaFieldTypes } = input;
  const fieldDef = FieldRegistry[fieldType];
  let normalizedShape: Record<string, FieldSchemaDefinition> | undefined;

  if (fieldType === FieldType.FORMULA && !configShape) {
    throw new BadRequestException('Formula field requires configShape with expressionTree.');
  }

  if (shape) {
    if (!fieldDef?.shape) {
      throw new BadRequestException('Invalid shape structure for this field type.');
    }

    const schemaCandidate = normalizeShapeSchema(shape);
    if (schemaCandidate) {
      if (!isSchemaCompatible(schemaCandidate, fieldDef.shape)) {
        throw new BadRequestException('Invalid shape structure for this field type.');
      }
      normalizedShape = fieldDef.shape;
    } else {
      const isValidShape = validateValueAgainstSchema(shape, fieldDef.shape);
      if (!isValidShape) {
        throw new BadRequestException('Invalid shape structure for this field type.');
      }
    }
  }

  let configPayload = configShape;

  if (configShape) {
    if (fieldType === FieldType.FORMULA) {
      const rawConfig = configShape as any;
      const providedConfig =
        rawConfig?.normalized && typeof rawConfig.normalized === 'object'
          ? rawConfig.normalized
          : rawConfig;

      if (!providedConfig?.expressionTree) {
        throw new BadRequestException(
          'Invalid formula config: configShape.expressionTree is required (pass configShape = normalize.normalized, not the whole normalize response).',
        );
      }

      const { config, errors } = normalizeFormulaConfig({
        expressionTree: providedConfig.expressionTree,
        category: providedConfig.category,
        fieldTypes: formulaFieldTypes,
      });

      if (!config || errors.length > 0) {
        throw new BadRequestException(`Invalid formula config: ${errors.join('; ')}`);
      }

      configPayload = {
        category: config.category,
        expressionTree: config.expressionTree,
        dependsOnFields: config.dependsOnFields,
        schemaVersion: config.schemaVersion,
      };
    }

    const isValidConfigShape = validateValueAgainstSchema(configPayload, fieldDef?.configShape);
    if (!isValidConfigShape) {
      throw new BadRequestException('Invalid configShape structure for this field type.');
    }
  }

  return { normalizedConfigShape: configPayload, normalizedShape };
}
