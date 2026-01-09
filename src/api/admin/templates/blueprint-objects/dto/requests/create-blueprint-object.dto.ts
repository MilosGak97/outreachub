import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TemplateItemProtection,
  TemplateItemProtectionEnumName,
} from '../../../../../enums/template/template-item-protection.enum';

export class CreateBlueprintObjectDto {
  @ApiProperty()
  @IsUUID()
  moduleId: string;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

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
