import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BulkAssociationResultItemDto {
  @ApiProperty({
    description: 'Index of the item in the original request',
  })
  index: number;

  @ApiProperty({
    description: 'Whether the operation succeeded',
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'ID of the created association (if successful)',
  })
  id?: string;

  @ApiPropertyOptional({
    description: 'Error message (if failed)',
  })
  error?: string;
}

export class BulkCreateAssociationsResponseDto {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 8 })
  successful: number;

  @ApiProperty({ example: 2 })
  failed: number;

  @ApiProperty({ type: [BulkAssociationResultItemDto] })
  results: BulkAssociationResultItemDto[];
}

export class BulkDeleteAssociationsResponseDto {
  @ApiProperty({ example: 10 })
  total: number;

  @ApiProperty({ example: 10 })
  successful: number;

  @ApiProperty({ example: 0 })
  failed: number;

  @ApiProperty({ type: [BulkAssociationResultItemDto] })
  results: BulkAssociationResultItemDto[];
}
