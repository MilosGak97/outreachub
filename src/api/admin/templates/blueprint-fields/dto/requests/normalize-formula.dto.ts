import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { FormulaCategory } from '../../../../../client/object-related/crm-object-field/formula/formula-category.enum';

export class NormalizeFormulaDto {
  @ApiProperty({
    description: 'The blueprint object ID to get formula context from',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  blueprintObjectId: string;

  @ApiProperty({
    description: 'The formula expression tree to normalize',
    example: {
      type: 'function',
      name: 'ADD',
      args: [
        { type: 'field', ref: '_price' },
        { type: 'field', ref: '_tax' },
      ],
    },
  })
  @IsObject()
  @IsNotEmpty()
  expressionTree: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Optional formula category for validation',
    enum: FormulaCategory,
  })
  @IsString()
  @IsOptional()
  category?: string;
}