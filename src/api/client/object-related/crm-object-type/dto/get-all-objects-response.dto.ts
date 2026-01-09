import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ObjectTypeDto } from './object-type.dto';

@ApiExtraModels(ObjectTypeDto)
export class GetAllObjectsResponseDto {
  @ApiProperty({ type: [ObjectTypeDto] }) // Reference the nested DTO
  result: ObjectTypeDto[];

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