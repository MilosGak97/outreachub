import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { PhoneNumberTypeDto } from './phone-number-type.dto';
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

@ApiExtraModels(PhoneNumberTypeDto)
export class PhoneNumbersResponseDto{
  @ApiProperty({ type: [PhoneNumberTypeDto]})
  result: PhoneNumberTypeDto[];


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