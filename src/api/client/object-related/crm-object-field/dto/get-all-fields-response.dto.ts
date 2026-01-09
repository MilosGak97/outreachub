import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectFieldDto } from '../../crm-object-type/dto/object-field.dto';


@ApiExtraModels(ObjectFieldDto)

export class GetAllFieldsResponseDto {
  @ApiProperty({ type: [ObjectFieldDto] }) // Reference the nested DTO
  result: ObjectFieldDto[];

  @ApiProperty()
  @IsNumber()
  @Type((): NumberConstructor=> Number)
  totalRecords: number;

  @ApiProperty()
  @IsNumber()
  @Type((): NumberConstructor=> Number)
  currentPage: number;

  @ApiProperty()
  @IsNumber()
  @Type((): NumberConstructor=> Number)
  totalPages: number;

  @ApiProperty()
  @IsNumber()
  @Type((): NumberConstructor=> Number)
  limit: number;

  @ApiProperty()
  @IsNumber()
  @Type((): NumberConstructor=> Number)
  offset: number;
}