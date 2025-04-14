import { ApiProperty } from '@nestjs/swagger';
import { StatesAbbreviation } from '../../enums/states-abbreviation.enum';
import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';

export class StatesResponseDto {
  @ApiProperty({ enum: StatesAbbreviation, required: true, isArray: true })
  @IsEnum(StatesAbbreviation)
  @IsArray()
  @IsNotEmpty()
  states: StatesAbbreviation[];
}
