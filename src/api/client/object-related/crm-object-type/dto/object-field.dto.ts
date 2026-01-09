import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FieldType } from '../../crm-object-field/field-types/field-type.enum';

export class ObjectFieldDto{
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  id:string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  name: string;


  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  apiName: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Type(() => String)
  description?: string;


  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  isRequired: boolean;


  @ApiProperty({ enum: FieldType, enumName: 'FieldType' })
  @IsEnum(FieldType)
  @IsNotEmpty()
  fieldType: FieldType;


}
