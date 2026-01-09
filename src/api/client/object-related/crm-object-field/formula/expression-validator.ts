import {
  FieldReferenceNode,
  FormulaNode,
  FormulaValidationContext,
  FormulaValidationResult,
  FunctionDefinition,
  LiteralNode,
  FormulaCategory,
  PrimitiveValueType,
} from './formula-types';
import {
  getFunctionDefinition,
  valueTypeFromLiteral,
} from './function-palette';

function isFieldNode(node: FormulaNode): node is FieldReferenceNode {
  return (node as FieldReferenceNode).field !== undefined;
}

function isLiteralNode(node: FormulaNode): node is LiteralNode {
  return (node as LiteralNode).literal !== undefined;
}

function resolveArgSpec(
  definition: FunctionDefinition,
  index: number,
): FunctionDefinition['args'][number] | undefined {
  if (!definition.args.length) return undefined;
  if (index < definition.args.length) {
    const current = definition.args[index];
    if (current.variadic) {
      return current;
    }
    return current;
  }
  const last = definition.args[definition.args.length - 1];
  if (last.variadic) {
    return last;
  }
  return undefined;
}

function getArgBounds(definition: FunctionDefinition): { min: number; max?: number } {
  let min = 0;
  let max = definition.args.length;

  definition.args.forEach((arg) => {
    if (!arg.optional) {
      min += 1;
    }
    if (arg.variadic) {
      max = undefined;
    }
  });

  return { min, max };
}

export function validateFormulaTree(
  node: FormulaNode,
  context: FormulaValidationContext = {},
): FormulaValidationResult {
  const errors: string[] = [];
  let nodeCount = 0;
  const maxDepth = context.maxDepth ?? 25;
  const maxNodes = context.maxNodes ?? 200;

  function visit(
    current: FormulaNode,
    path: string,
    depth: number,
  ): PrimitiveValueType {
    nodeCount += 1;
    if (nodeCount > maxNodes) {
      errors.push(`Expression exceeds node limit of ${maxNodes}.`);
      return PrimitiveValueType.ANY;
    }

    if (depth > maxDepth) {
      errors.push(`Expression exceeds max depth of ${maxDepth} at ${path}.`);
      return PrimitiveValueType.ANY;
    }

    if (isFieldNode(current)) {
      if (!current.field || typeof current.field !== 'string') {
        errors.push(`Field reference must be a string at ${path}.`);
        return PrimitiveValueType.ANY;
      }
      const fieldType = context.fieldTypes?.[current.field];
      if (!fieldType && context.allowUnknownFields !== true) {
        errors.push(`Unknown field "${current.field}" at ${path}.`);
      }
      return fieldType ?? PrimitiveValueType.ANY;
    }

    if (isLiteralNode(current)) {
      return valueTypeFromLiteral(current.literal);
    }

    if ((current as any).function) {
      const rawName = (current as any).function;
      const functionName = String(rawName ?? '').toUpperCase();
      const def = getFunctionDefinition(functionName);
      if (!def) {
        errors.push(`Unsupported function "${rawName}" at ${path}.`);
        return PrimitiveValueType.ANY;
      }

      const nodeCategory = (current as any).category as FormulaCategory | undefined;
      if (nodeCategory && def.category !== nodeCategory) {
        errors.push(
          `Function "${functionName}" is declared as "${nodeCategory}" but belongs to "${def.category}" (at ${path}).`,
        );
      }
      if (nodeCategory && context.category && nodeCategory !== context.category) {
        errors.push(
          `Expression category mismatch: expected "${context.category}" but got "${nodeCategory}" at ${path}.`,
        );
      }
      if (context.category && def.category !== context.category) {
        errors.push(
          `Function "${functionName}" is not allowed in category "${context.category}" (found at ${path}).`,
        );
      }

      const args = Array.isArray((current as any).args) ? (current as any).args : [];
      const bounds = getArgBounds(def);

      if (args.length < bounds.min) {
        errors.push(
          `Function "${functionName}" expects at least ${bounds.min} argument(s) but received ${args.length} at ${path}.`,
        );
      }
      if (bounds.max !== undefined && args.length > bounds.max) {
        errors.push(
          `Function "${functionName}" expects at most ${bounds.max} argument(s) but received ${args.length} at ${path}.`,
        );
      }

      args.forEach((arg, idx) => {
        const spec = resolveArgSpec(def, idx);
        const resolvedType = visit(arg, `${path}.args[${idx}]`, depth + 1);
        if (spec && spec.types.length && resolvedType !== PrimitiveValueType.ANY) {
          const allowed = spec.types.includes(resolvedType);
          if (!allowed) {
            errors.push(
              `Argument ${idx + 1} for "${functionName}" must be one of [${spec.types.join(
                ', ',
              )}] but got "${resolvedType}" at ${path}.`,
            );
          }
        }
      });

      return def.returnType;
    }

    errors.push(`Invalid node at ${path}.`);
    return PrimitiveValueType.ANY;
  }

  const inferredType = visit(node, 'root', 1);
  return {
    valid: errors.length === 0,
    errors,
    inferredType,
  };
}
