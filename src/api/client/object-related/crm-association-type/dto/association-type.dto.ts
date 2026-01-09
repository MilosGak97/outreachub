import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { AssociationCardinality } from '../../../../enums/object/association-cardinality.enum';

export class AssociationTypeDto {
  @ApiProperty()
  @IsUUID()
  @Type((): StringConstructor => String)
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Type((): StringConstructor => String)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Type((): StringConstructor => String)
  apiName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Type((): StringConstructor => String)
  description?: string;

  @ApiProperty()
  @IsBoolean()
  @Type((): BooleanConstructor => Boolean)
  isBidirectional: boolean;

  @ApiPropertyOptional({
    description: 'Label for the reverse direction (target -> source).',
  })
  @IsOptional()
  @IsString()
  @Type((): StringConstructor => String)
  reverseName?: string;

  @ApiProperty()
  @IsUUID()
  @Type((): StringConstructor => String)
  sourceObjectTypeId: string;

  @ApiProperty()
  @IsUUID()
  @Type((): StringConstructor => String)
  targetObjectTypeId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Type((): StringConstructor => String)
  sourceObjectTypeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Type((): StringConstructor => String)
  targetObjectTypeName?: string;

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

