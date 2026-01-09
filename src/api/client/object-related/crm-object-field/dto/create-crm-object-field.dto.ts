import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { FieldType } from '../field-types/field-type.enum';

export class CreateCrmObjectFieldDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ enum: FieldType, enumName: 'FieldType' })
  @IsEnum(FieldType)
  fieldType: FieldType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  apiName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  isRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsUUID()
  objectTypeId: string;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  shape?: Record<string, any>;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  configShape?: Record<string, any>;
}
