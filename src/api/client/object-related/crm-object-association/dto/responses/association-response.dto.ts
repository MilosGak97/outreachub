import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CrmObjectAssociationResponseDto {
  @ApiProperty({
    description: 'Association ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Association type ID',
  })
  typeId: string;

  @ApiProperty({
    description: 'Association type name',
  })
  typeName: string;

  @ApiProperty({
    description: 'Association type API name',
  })
  typeApiName: string;

  @ApiProperty({
    description: 'Source object ID',
  })
  sourceObjectId: string;

  @ApiProperty({
    description: 'Source object display name',
  })
  sourceObjectDisplayName: string;

  @ApiProperty({
    description: 'Source object type API name',
  })
  sourceObjectTypeApiName: string;

  @ApiProperty({
    description: 'Target object ID',
  })
  targetObjectId: string;

  @ApiProperty({
    description: 'Target object display name',
  })
  targetObjectDisplayName: string;

  @ApiProperty({
    description: 'Target object type API name',
  })
  targetObjectTypeApiName: string;

  @ApiPropertyOptional({
    description: 'Association metadata',
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'Creation timestamp',
  })
  createdAt: string;
}