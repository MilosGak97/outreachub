import { FieldReferenceNode, FormulaNode, FunctionNode } from './formula-types';

export function collectFieldReferences(
  node: FormulaNode,
  acc: Set<string> = new Set(),
): Set<string> {
  if ((node as FieldReferenceNode).field) {
    acc.add((node as FieldReferenceNode).field);
    return acc;
  }

  if ((node as FunctionNode).function && Array.isArray((node as FunctionNode).args)) {
    (node as FunctionNode).args.forEach((child) => collectFieldReferences(child, acc));
  }

  return acc;
}

