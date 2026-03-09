import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { FieldType } from '../field-types/field-type.enum';

export class GetFieldTypeDefinitionDto {
  @ApiPropertyOptional({
    description: 'Optional field type; when omitted, returns all definitions.',
    enum: FieldType,
    enumName: 'FieldType',
  })
  @IsOptional()
  @IsEnum(FieldType)
  type?: FieldType;
}
