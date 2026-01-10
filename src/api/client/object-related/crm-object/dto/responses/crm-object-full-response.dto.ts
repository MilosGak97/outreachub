import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FieldType } from '../../../crm-object-field/field-types/field-type.enum';
import { CrmObjectListItemDto } from './crm-object-list-item.dto';

export class FieldWithMetadataDto {
  @ApiProperty({
    description: 'Field API name',
    example: 'email',
  })
  apiName: string;

  @ApiProperty({
    description: 'Field display name',
    example: 'Email Address',
  })
  name: string;

  @ApiProperty({
    description: 'Field type',
    enum: FieldType,
    enumName: 'FieldType',
  })
  fieldType: FieldType;

  @ApiProperty({
    description: 'Whether the field is required',
    example: true,
  })
  isRequired: boolean;

  @ApiPropertyOptional({
    description: 'Current value of the field',
    example: 'john@example.com',
  })
  value?: any;

  @ApiPropertyOptional({
    description: 'Field shape definition',
  })
  shape?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Field config shape',
  })
  configShape?: Record<string, any>;
}

export class AssociationSummaryDto {
  @ApiProperty({
    description: 'Association type ID',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  typeId: string;

  @ApiProperty({
    description: 'Association type name',
    example: 'Contact Deals',
  })
  typeName: string;

  @ApiProperty({
    description: 'Association type API name',
    example: 'contact_deals',
  })
  typeApiName: string;

  @ApiProperty({
    description: 'Direction of association from this object perspective',
    enum: ['source', 'target'],
  })
  direction: 'source' | 'target';

  @ApiProperty({
    description: 'Number of associated objects',
    example: 5,
  })
  count: number;

  @ApiProperty({
    type: [CrmObjectListItemDto],
    description: 'Preview of first 5 associated objects',
  })
  preview: CrmObjectListItemDto[];
}

export class CrmObjectFullResponseDto {
  @ApiProperty({
    description: 'Unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Object type ID',
    example: '660e8400-e29b-41d4-a716-446655440000',
  })
  objectTypeId: string;

  @ApiProperty({
    description: 'Object type API name',
    example: 'contact',
  })
  objectTypeApiName: string;

  @ApiProperty({
    description: 'Object type display name',
    example: 'Contact',
  })
  objectTypeName: string;

  @ApiProperty({
    description: 'Display name of the object',
    example: 'John Doe',
  })
  displayName: string;

  @ApiProperty({
    description: 'Raw field values keyed by apiName',
  })
  fieldValues: Record<string, any>;

  @ApiProperty({
    type: [FieldWithMetadataDto],
    description: 'Field values with metadata for rendering',
  })
  fields: FieldWithMetadataDto[];

  @ApiProperty({
    type: [AssociationSummaryDto],
    description: 'Summary of associations',
  })
  associations: AssociationSummaryDto[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: string;
}