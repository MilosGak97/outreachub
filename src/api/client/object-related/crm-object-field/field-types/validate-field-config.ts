import { BadRequestException } from '@nestjs/common';
import { FieldRegistry } from './index';
import { FieldType } from './field-type.enum';
import { PrimitiveValueType } from '../formula/primitive-value-type.enum';
import { normalizeFormulaConfig } from '../formula/normalize-formula-config';
import { validateValueAgainstSchema } from './validate-value-against-schema';

export interface FieldConfigValidationInput {
  fieldType: FieldType;
  shape?: Record<string, any>;
  configShape?: Record<string, any>;
  formulaFieldTypes?: Record<string, PrimitiveValueType>;
}

export interface FieldConfigValidationResult {
  normalizedConfigShape?: Record<string, any>;
}

export function validateAndNormalizeFieldConfig(
  input: FieldConfigValidationInput,
): FieldConfigValidationResult {
  const { fieldType, shape, configShape, formulaFieldTypes } = input;

  if (fieldType === FieldType.FORMULA && !configShape) {
    throw new BadRequestException('Formula field requires configShape with expressionTree.');
  }

  const fieldDef = FieldRegistry[fieldType];

  if (shape) {
    const isValidShape = validateValueAgainstSchema(shape, fieldDef?.shape);
    if (!isValidShape) {
      throw new BadRequestException('Invalid shape structure for this field type.');
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

  return { normalizedConfigShape: configPayload };
}
