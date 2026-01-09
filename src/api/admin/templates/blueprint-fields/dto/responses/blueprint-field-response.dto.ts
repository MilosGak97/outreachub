import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FieldType } from '../../../../../client/object-related/crm-object-field/field-types/field-type.enum';
import {
  TemplateItemProtection,
  TemplateItemProtectionEnumName,
} from '../../../../../enums/template/template-item-protection.enum';

export class BlueprintFieldResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  blueprintObjectId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  apiName: string;

  @ApiProperty({ enum: FieldType, enumName: 'FieldType' })
  fieldType: FieldType;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty()
  isRequired: boolean;

  @ApiPropertyOptional({ type: 'object' })
  shape?: Record<string, any>;

  @ApiPropertyOptional({ type: 'object' })
  configShape?: Record<string, any>;

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
