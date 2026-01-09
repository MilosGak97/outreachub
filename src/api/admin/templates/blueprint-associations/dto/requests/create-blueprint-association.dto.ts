import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
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
import { AssociationCardinality } from '../../../../../enums/object/association-cardinality.enum';

import {
  TemplateItemProtection,
  TemplateItemProtectionEnumName,
} from '../../../../../enums/template/template-item-protection.enum';

export class CreateBlueprintAssociationDto {
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

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  sourceObjectApiName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  targetObjectApiName: string;

  @ApiProperty({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
  })
  @IsEnum(AssociationCardinality)
  sourceCardinality: AssociationCardinality;

  @ApiProperty({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
  })
  @IsEnum(AssociationCardinality)
  targetCardinality: AssociationCardinality;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBidirectional?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  reverseName?: string;

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
