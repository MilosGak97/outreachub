import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class NormalizeFormulaResponseDto {
  @ApiProperty({
    description: 'Whether the formula is valid',
    example: true,
  })
  valid: boolean;

  @ApiProperty({
    description: 'List of validation errors (empty if valid)',
    type: [String],
    example: [],
  })
  errors: string[];

  @ApiPropertyOptional({
    description: 'Normalized formula configuration (if valid)',
    example: {
      category: 'numeric',
      expressionTree: {
        type: 'function',
        name: 'ADD',
        args: [
          { type: 'field', ref: '_price' },
          { type: 'field', ref: '_tax' },
        ],
      },
      dependsOnFields: ['_price', '_tax'],
      schemaVersion: 1,
    },
  })
  normalized?: Record<string, any>;
}