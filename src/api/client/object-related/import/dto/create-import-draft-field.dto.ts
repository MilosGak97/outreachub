import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { FieldType } from '../../crm-object-field/field-types/field-type.enum';

export class CreateImportDraftFieldDto {
  @ApiProperty()
  @IsUUID()
  @IsString()
  objectTypeId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  apiName?: string;

  @ApiProperty({ enum: FieldType, enumName: 'FieldType' })
  @IsEnum(FieldType)
  fieldType: FieldType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  shape?: Record<string, any>;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  configShape?: Record<string, any>;
}
