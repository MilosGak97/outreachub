import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateIf,
} from 'class-validator';
import { AssociationCardinality } from '../../../../enums/object/association-cardinality.enum';

export class CreateCrmAssociationTypeDto {
  @ApiProperty({ required: true, example: 'Company ↔ Contact' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    required: true,
    example: 'company_contacts',
    description: 'Lowercase snake_case identifier, unique per company.',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/)
  apiName: string;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    required: false,
    default: true,
    description:
      'When true, the association type can be created from either endpoint and traversed both ways.',
  })
  @IsOptional()
  @IsBoolean()
  @Type((): BooleanConstructor => Boolean)
  isBidirectional?: boolean;

  @ApiPropertyOptional({
    required: false,
    example: 'Company',
    description:
      'Label for the reverse direction (target -> source). Required when isBidirectional is true (or omitted).',
  })
  @ValidateIf((o: CreateCrmAssociationTypeDto): boolean => o.isBidirectional !== false)
  @IsNotEmpty()
  @IsString()
  reverseName?: string;

  @ApiProperty({ required: true })
  @IsUUID('4')
  sourceObjectTypeId: string;

  @ApiProperty({ required: true })
  @IsUUID('4')
  targetObjectTypeId: string;

  @ApiProperty({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
    example: AssociationCardinality.MANY,
    description: 'Max number of targets per source.',
  })
  @IsEnum(AssociationCardinality)
  sourceCardinality: AssociationCardinality;

  @ApiProperty({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
    example: AssociationCardinality.ONE,
    description: 'Max number of sources per target.',
  })
  @IsEnum(AssociationCardinality)
  targetCardinality: AssociationCardinality;
}

