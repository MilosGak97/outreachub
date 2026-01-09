import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { FieldType } from '../../crm-object-field/field-types/field-type.enum';

const toArray = (value: unknown): unknown[] | undefined => {
  if (value === undefined || value === null) return undefined;
  return Array.isArray(value) ? value : [value];
};

export class GetAllQueryDto{
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @ApiProperty({ required: false, enum: FieldType, enumName: 'FieldType', isArray: true })
  @Transform(({ value }) => toArray(value), { toClassOnly: true })
  @IsOptional()
  @IsEnum(FieldType, { each: true })
  fieldType?: FieldType[];

  @ApiProperty({
    required: false,
    description: 'Return object types that have no association with this object type id.',
  })
  @IsOptional()
  @IsUUID()
  associationCheck?: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  offset: number;
}
