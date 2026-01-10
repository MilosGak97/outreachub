import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkedObjectDto {
  @ApiProperty({
    description: 'Association ID',
  })
  associationId: string;

  @ApiProperty({
    description: 'Linked object ID',
  })
  objectId: string;

  @ApiProperty({
    description: 'Display name of the linked object',
  })
  displayName: string;

  @ApiProperty({
    description: 'Object type API name',
  })
  objectTypeApiName: string;

  @ApiProperty({
    description: 'Object type display name',
  })
  objectTypeName: string;

  @ApiPropertyOptional({
    description: 'Association metadata',
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: 'When the association was created',
  })
  associatedAt: string;
}

export class AssociationTypeGroupDto {
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
    description: 'Whether this object is source or target in the association type',
    enum: ['source', 'target'],
  })
  role: 'source' | 'target';

  @ApiProperty({
    description: 'Label for this direction (e.g., "Related Contacts" or "Related Deals")',
  })
  label: string;

  @ApiProperty({
    type: [LinkedObjectDto],
    description: 'List of linked objects',
  })
  linkedObjects: LinkedObjectDto[];

  @ApiProperty({
    description: 'Total count of linked objects',
  })
  total: number;
}

export class ObjectAssociationsResponseDto {
  @ApiProperty({
    description: 'Object ID',
  })
  objectId: string;

  @ApiProperty({
    type: [AssociationTypeGroupDto],
    description: 'Associations grouped by type',
  })
  associationGroups: AssociationTypeGroupDto[];
}
