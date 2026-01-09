import { ApiProperty } from '@nestjs/swagger';
import { AssociationCardinality } from '../../../../../enums/object/association-cardinality.enum';

import {
  TemplateItemProtection,
  TemplateItemProtectionEnumName,
} from '../../../../../enums/template/template-item-protection.enum';

export class BlueprintAssociationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  apiName: string;

  @ApiProperty()
  sourceObjectApiName: string;

  @ApiProperty()
  targetObjectApiName: string;

  @ApiProperty({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
  })
  sourceCardinality: AssociationCardinality;

  @ApiProperty({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
  })
  targetCardinality: AssociationCardinality;

  @ApiProperty()
  isBidirectional: boolean;

  @ApiProperty({ nullable: true })
  reverseName: string | null;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({
    enum: TemplateItemProtection,
    enumName: TemplateItemProtectionEnumName,
  })
  protection: TemplateItemProtection;

  @ApiProperty()
  displayOrder: number;

  @ApiProperty()
  createdAt: Date;
}
