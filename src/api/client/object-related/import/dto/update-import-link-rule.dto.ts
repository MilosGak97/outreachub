import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ImportLinkMode } from '../../../../enums/import/import-link-mode.enum';

export class UpdateImportLinkRuleDto {
  @ApiPropertyOptional({ enum: ImportLinkMode, enumName: 'ImportLinkMode' })
  @IsOptional()
  @IsEnum(ImportLinkMode)
  mode?: ImportLinkMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  @IsString()
  associationTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  @IsString()
  draftAssociationTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  @IsString()
  sourceObjectTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('4')
  @IsString()
  targetObjectTypeId?: string;

  @ApiPropertyOptional({ description: 'CRM field id to match on source object' })
  @IsOptional()
  @IsUUID('4')
  @IsString()
  sourceMatchField?: string;

  @ApiPropertyOptional({ description: 'CRM field id to match on target object' })
  @IsOptional()
  @IsUUID('4')
  @IsString()
  targetMatchField?: string;
}
