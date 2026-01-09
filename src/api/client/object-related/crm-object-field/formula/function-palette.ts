import {
  FormulaCategory,
  FunctionDefinition,
  PrimitiveValueType,
} from './formula-types';

const mathFunctions: FunctionDefinition[] = [
  {
    name: 'SUM',
    description: 'Adds all provided numbers and returns the total.',
    category: FormulaCategory.MATH,
    returnType: PrimitiveValueType.NUMBER,
    args: [{ types: [PrimitiveValueType.NUMBER], variadic: true }],
  },
  {
    name: 'SUBTRACT',
    description: 'Subtracts the second number from the first number.',
    category: FormulaCategory.MATH,
    returnType: PrimitiveValueType.NUMBER,
    args: [
      { types: [PrimitiveValueType.NUMBER] },
      { types: [PrimitiveValueType.NUMBER] },
    ],
  },
  {
    name: 'MULTIPLY',
    description: 'Multiplies all provided numbers and returns the product.',
    category: FormulaCategory.MATH,
    returnType: PrimitiveValueType.NUMBER,
    args: [{ types: [PrimitiveValueType.NUMBER], variadic: true }],
  },
  {
    name: 'DIVIDE',
    description: 'Divides the first number by the second number.',
    category: FormulaCategory.MATH,
    returnType: PrimitiveValueType.NUMBER,
    args: [
      { types: [PrimitiveValueType.NUMBER] },
      { types: [PrimitiveValueType.NUMBER] },
    ],
  },
  {
    name: 'ROUND',
    description: 'Rounds a number to the specified number of decimal places (defaults to 0).',
    category: FormulaCategory.MATH,
    returnType: PrimitiveValueType.NUMBER,
    args: [
      { types: [PrimitiveValueType.NUMBER] },
      { types: [PrimitiveValueType.NUMBER], optional: true },
    ],
  },
  {
    name: 'MIN',
    description: 'Returns the smallest number from the provided values.',
    category: FormulaCategory.MATH,
    returnType: PrimitiveValueType.NUMBER,
    args: [{ types: [PrimitiveValueType.NUMBER], variadic: true }],
  },
  {
    name: 'MAX',
    description: 'Returns the largest number from the provided values.',
    category: FormulaCategory.MATH,
    returnType: PrimitiveValueType.NUMBER,
    args: [{ types: [PrimitiveValueType.NUMBER], variadic: true }],
  },
  {
    name: 'AVERAGE',
    description: 'Returns the average (mean) of the provided numbers.',
    category: FormulaCategory.MATH,
    returnType: PrimitiveValueType.NUMBER,
    args: [{ types: [PrimitiveValueType.NUMBER], variadic: true }],
  },
];

const stringFunctions: FunctionDefinition[] = [
  {
    name: 'CONCAT',
    description: 'Joins multiple text values into a single string.',
    category: FormulaCategory.STRING,
    returnType: PrimitiveValueType.STRING,
    args: [{ types: [PrimitiveValueType.STRING], variadic: true }],
  },
  {
    name: 'JOIN',
    description: 'Joins multiple text values using a separator (first argument).',
    category: FormulaCategory.STRING,
    returnType: PrimitiveValueType.STRING,
    args: [
      { types: [PrimitiveValueType.STRING] }, // separator
      { types: [PrimitiveValueType.STRING], variadic: true },
    ],
  },
  {
    name: 'UPPER',
    description: 'Converts text to uppercase.',
    category: FormulaCategory.STRING,
    returnType: PrimitiveValueType.STRING,
    args: [{ types: [PrimitiveValueType.STRING] }],
  },
  {
    name: 'LOWER',
    description: 'Converts text to lowercase.',
    category: FormulaCategory.STRING,
    returnType: PrimitiveValueType.STRING,
    args: [{ types: [PrimitiveValueType.STRING] }],
  },
  {
    name: 'TRIM',
    description: 'Removes leading and trailing whitespace from text.',
    category: FormulaCategory.STRING,
    returnType: PrimitiveValueType.STRING,
    args: [{ types: [PrimitiveValueType.STRING] }],
  },
  {
    name: 'SUBSTRING',
    description: 'Returns part of a string starting at a position, with an optional length.',
    category: FormulaCategory.STRING,
    returnType: PrimitiveValueType.STRING,
    args: [
      { types: [PrimitiveValueType.STRING] },
      { types: [PrimitiveValueType.NUMBER] },
      { types: [PrimitiveValueType.NUMBER], optional: true },
    ],
  },
  {
    name: 'LENGTH',
    description: 'Returns the number of characters in text.',
    category: FormulaCategory.STRING,
    returnType: PrimitiveValueType.NUMBER,
    args: [{ types: [PrimitiveValueType.STRING] }],
  },
];

const dateFunctions: FunctionDefinition[] = [
  {
    name: 'ADD_DAYS',
    description: 'Adds a number of days to a date/datetime and returns the resulting date.',
    category: FormulaCategory.DATE,
    returnType: PrimitiveValueType.DATE,
    args: [
      { types: [PrimitiveValueType.DATE, PrimitiveValueType.DATETIME] },
      { types: [PrimitiveValueType.NUMBER] },
    ],
  },
  {
    name: 'ADD_MONTHS',
    description: 'Adds a number of months to a date/datetime and returns the resulting date.',
    category: FormulaCategory.DATE,
    returnType: PrimitiveValueType.DATE,
    args: [
      { types: [PrimitiveValueType.DATE, PrimitiveValueType.DATETIME] },
      { types: [PrimitiveValueType.NUMBER] },
    ],
  },
  {
    name: 'DIFF_DAYS',
    description: 'Returns the number of days between two dates/datetimes.',
    category: FormulaCategory.DATE,
    returnType: PrimitiveValueType.NUMBER,
    args: [
      { types: [PrimitiveValueType.DATE, PrimitiveValueType.DATETIME] },
      { types: [PrimitiveValueType.DATE, PrimitiveValueType.DATETIME] },
    ],
  },
  {
    name: 'DIFF_MONTHS',
    description: 'Returns the number of months between two dates/datetimes.',
    category: FormulaCategory.DATE,
    returnType: PrimitiveValueType.NUMBER,
    args: [
      { types: [PrimitiveValueType.DATE, PrimitiveValueType.DATETIME] },
      { types: [PrimitiveValueType.DATE, PrimitiveValueType.DATETIME] },
    ],
  },
  {
    name: 'FORMAT_DATE',
    description: 'Formats a date/datetime using a pattern string and returns the formatted text.',
    category: FormulaCategory.DATE,
    returnType: PrimitiveValueType.STRING,
    args: [
      { types: [PrimitiveValueType.DATE, PrimitiveValueType.DATETIME] },
      { types: [PrimitiveValueType.STRING] },
    ],
  },
];

const definitions: FunctionDefinition[] = [
  ...mathFunctions,
  ...stringFunctions,
  ...dateFunctions,
];

export const FUNCTION_PALETTE: Record<string, FunctionDefinition> = definitions.reduce(
  (acc, def) => {
    acc[def.name] = def;
    return acc;
  },
  {} as Record<string, FunctionDefinition>,
);

export const CATEGORY_TO_FUNCTIONS: Record<FormulaCategory, string[]> = {
  [FormulaCategory.MATH]: mathFunctions.map((f) => f.name),
  [FormulaCategory.STRING]: stringFunctions.map((f) => f.name),
  [FormulaCategory.DATE]: dateFunctions.map((f) => f.name),
};

export function getFunctionDefinition(name: string): FunctionDefinition | undefined {
  if (!name) return undefined;
  return FUNCTION_PALETTE[name.toUpperCase()];
}

export function valueTypeFromLiteral(value: unknown): PrimitiveValueType {
  const t = typeof value;
  if (t === 'number') return PrimitiveValueType.NUMBER;
  if (t === 'string') return PrimitiveValueType.STRING;
  if (t === 'boolean') return PrimitiveValueType.BOOLEAN;
  return PrimitiveValueType.ANY;
}
