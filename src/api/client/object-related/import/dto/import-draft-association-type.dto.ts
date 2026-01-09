import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AssociationCardinality } from '../../../../enums/object/association-cardinality.enum';

export class ImportDraftAssociationTypeDto {
  @ApiProperty()
  @IsUUID()
  @IsString()
  id: string;

  @ApiProperty()
  @IsUUID()
  @IsString()
  importSessionId: string;

  @ApiProperty()
  @IsUUID()
  @IsString()
  sourceObjectTypeId: string;

  @ApiProperty()
  @IsUUID()
  @IsString()
  targetObjectTypeId: string;

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

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  apiName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBidirectional?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reverseName?: string;
}
