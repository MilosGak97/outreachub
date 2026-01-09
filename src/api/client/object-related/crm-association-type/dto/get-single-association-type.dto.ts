import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { AssociationCardinality } from '../../../../enums/object/association-cardinality.enum';

export class GetSingleAssociationTypeDto {
  @ApiProperty()
  @IsUUID()
  id: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  apiName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsBoolean()
  isBidirectional: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reverseName?: string;

  @ApiProperty()
  @IsUUID()
  sourceObjectTypeId: string;

  @ApiProperty()
  @IsUUID()
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
}

