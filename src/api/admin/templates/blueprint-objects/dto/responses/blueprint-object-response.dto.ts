import { ApiProperty } from '@nestjs/swagger';
import {
  TemplateItemProtection,
  TemplateItemProtectionEnumName,
} from '../../../../../enums/template/template-item-protection.enum';

export class BlueprintObjectResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  moduleId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  apiName: string;

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
  fieldsCount: number;

  @ApiProperty()
  createdAt: Date;
}
