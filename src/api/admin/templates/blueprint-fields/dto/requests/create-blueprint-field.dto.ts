import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldType } from '../../../../../client/object-related/crm-object-field/field-types/field-type.enum';
import {
  TemplateItemProtection,
  TemplateItemProtectionEnumName,
} from '../../../../../enums/template/template-item-protection.enum';

export class CreateBlueprintFieldDto {
  @ApiProperty()
  @IsUUID()
  blueprintObjectId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  apiName: string;

  @ApiProperty({ enum: FieldType, enumName: 'FieldType' })
  @IsEnum(FieldType)
  fieldType: FieldType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  shape?: Record<string, any>;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  configShape?: Record<string, any>;

  @ApiPropertyOptional({
    enum: TemplateItemProtection,
    enumName: TemplateItemProtectionEnumName,
  })
  @IsOptional()
  @IsEnum(TemplateItemProtection)
  protection?: TemplateItemProtection;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
