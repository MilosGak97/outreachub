import { FormulaCategory } from './formula-category.enum';
import { PrimitiveValueType } from './primitive-value-type.enum';

export { FormulaCategory, PrimitiveValueType };

export type FormulaLiteral = string | number | boolean | null;

export interface FieldReferenceNode {
  field: string;
}

export interface LiteralNode {
  literal: FormulaLiteral;
}

export interface FunctionNode {
  function: string;
  args: FormulaNode[];
  category?: FormulaCategory; // typically present only on the root
}

export type FormulaNode = FieldReferenceNode | LiteralNode | FunctionNode;

export interface FunctionArgSpec {
  types: PrimitiveValueType[];
  optional?: boolean;
  variadic?: boolean;
}

export interface FunctionDefinition {
  name: string;
  description: string;
  category: FormulaCategory;
  returnType: PrimitiveValueType;
  args: FunctionArgSpec[];
}

export interface FormulaValidationContext {
  category?: FormulaCategory;
  fieldTypes?: Record<string, PrimitiveValueType>;
  allowUnknownFields?: boolean;
  maxDepth?: number;
  maxNodes?: number;
}

export interface FormulaValidationResult {
  valid: boolean;
  errors: string[];
  inferredType?: PrimitiveValueType;
}
