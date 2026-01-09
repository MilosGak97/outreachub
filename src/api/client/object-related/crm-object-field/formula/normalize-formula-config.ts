import { collectFieldReferences } from './formula-tree';
import { validateFormulaTree } from './expression-validator';
import {
  FormulaCategory,
  FormulaNode,
  FormulaValidationResult,
  PrimitiveValueType,
} from './formula-types';

export interface FormulaConfigInput {
  expressionTree?: FormulaNode;
  category?: FormulaCategory;
  fieldTypes?: Record<string, PrimitiveValueType>;
}

export interface NormalizedFormulaConfig {
  category: FormulaCategory;
  expressionTree: FormulaNode;
  dependsOnFields: string[];
  schemaVersion: number;
  validation: FormulaValidationResult;
}

function normalizeFunctions(node: FormulaNode): FormulaNode {
  if ((node as any).function) {
    const fnNode = node as any as { function: string; args: FormulaNode[]; category?: FormulaCategory };
    const normalizedNode: any = {
      function: String(fnNode.function ?? '').toUpperCase(),
      args: Array.isArray(fnNode.args)
        ? fnNode.args.map((child) => normalizeFunctions(child))
        : [],
    };

    if (fnNode.category) {
      normalizedNode.category = fnNode.category;
    }
    return normalizedNode as FormulaNode;
  }
  return node;
}

export function normalizeFormulaConfig(
  input: FormulaConfigInput,
): { config?: NormalizedFormulaConfig; errors: string[] } {
  const errors: string[] = [];

  const category: FormulaCategory = input.category ?? FormulaCategory.MATH;
  const expressionTree = input.expressionTree;

  if (!expressionTree) {
    errors.push('Formula must include expressionTree.');
    return { errors };
  }

  const normalizedTree = normalizeFunctions(expressionTree);
  if ((normalizedTree as any).function) {
    (normalizedTree as any).category = category;
  }
  const validation = validateFormulaTree(normalizedTree, {
    category,
    fieldTypes: input.fieldTypes,
  });

  if (!validation.valid) {
    errors.push(...validation.errors);
  }

  const dependsOn = Array.from(collectFieldReferences(normalizedTree));

  const config: NormalizedFormulaConfig = {
    category,
    expressionTree: normalizedTree,
    dependsOnFields: dependsOn,
    schemaVersion: 1,
    validation,
  };

  return { config, errors };
}
