import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
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

export class UpdateBlueprintAssociationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  apiName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  sourceObjectApiName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Length(1, 100)
  @Matches(/^_[a-z][a-z0-9_]*$/)
  targetObjectApiName?: string;

  @ApiPropertyOptional({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
  })
  @IsOptional()
  @IsEnum(AssociationCardinality)
  sourceCardinality?: AssociationCardinality;

  @ApiPropertyOptional({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
  })
  @IsOptional()
  @IsEnum(AssociationCardinality)
  targetCardinality?: AssociationCardinality;

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
