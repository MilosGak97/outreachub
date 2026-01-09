import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { AssociationCardinality } from '../../../../enums/object/association-cardinality.enum';

export class CreateImportDraftAssociationTypeDto {
  @ApiProperty()
  @IsUUID('4')
  @IsString()
  sourceObjectTypeId: string;

  @ApiProperty()
  @IsUUID('4')
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
  @Matches(/^[a-z][a-z0-9_]*$/)
  apiName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isBidirectional?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reverseName?: string;
}
