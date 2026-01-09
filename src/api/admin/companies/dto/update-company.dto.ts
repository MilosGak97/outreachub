import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumberString, IsOptional, IsString, Length } from 'class-validator';
import { StatesAbbreviation } from '../../../enums/common/states-abbreviation.enum';

export class UpdateCompanyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({required: false})
  @IsOptional()
  @IsString()
  @Length(2, 2)
  phoneCountryCode?: string;

  @ApiProperty({required: false})
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address1?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address2?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({ required: false, enum: StatesAbbreviation, enumName: 'StatesAbbreviation' })
  @IsOptional()
  @IsEnum(StatesAbbreviation)
  state?: StatesAbbreviation;

  @ApiProperty({ required: false })
  @IsNumberString()
  @IsOptional()
  zipCode?: string;
}
