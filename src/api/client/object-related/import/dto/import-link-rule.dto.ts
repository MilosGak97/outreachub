import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ImportLinkMode } from '../../../../enums/import/import-link-mode.enum';

export class ImportLinkRuleDto {
  @ApiProperty()
  @IsUUID()
  @IsString()
  id: string;

  @ApiProperty({ enum: ImportLinkMode, enumName: 'ImportLinkMode' })
  @IsEnum(ImportLinkMode)
  mode: ImportLinkMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @IsString()
  associationTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @IsString()
  draftAssociationTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  @IsString()
  sourceObjectTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
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
