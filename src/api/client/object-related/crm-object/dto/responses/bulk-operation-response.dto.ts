import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkResultItemDto {
  @ApiProperty({
    description: 'Index of the item in the original request',
    example: 0,
  })
  index: number;

  @ApiProperty({
    description: 'Whether the operation succeeded',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'ID of the created/updated object (if successful)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id?: string;

  @ApiPropertyOptional({
    description: 'Error message (if failed)',
    example: 'Required field "email" is missing',
  })
  error?: string;
}

export class BulkCreateResponseDto {
  @ApiProperty({
    description: 'Total items in the request',
    example: 10,
  })
  total: number;

  @ApiProperty({
    description: 'Number of successful operations',
    example: 8,
  })
  successful: number;

  @ApiProperty({
    description: 'Number of failed operations',
    example: 2,
  })
  failed: number;

  @ApiProperty({
    type: [BulkResultItemDto],
    description: 'Results for each item',
  })
  results: BulkResultItemDto[];
}

export class BulkUpdateResponseDto {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 8 })
  successful: number;

  @ApiProperty({ example: 2 })
  failed: number;

  @ApiProperty({ type: [BulkResultItemDto] })
  results: BulkResultItemDto[];
}

export class BulkDeleteResponseDto {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 10 })
  successful: number;

  @ApiProperty({ example: 0 })
  failed: number;

  @ApiProperty({ type: [BulkResultItemDto] })
  results: BulkResultItemDto[];
}