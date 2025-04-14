import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsOptional, IsString } from 'class-validator';
import { StatesAbbreviation } from '../../../enums/states-abbreviation.enum';
import { PhoneNumberTypeDto } from '../../../common/dto/phone-number-type.dto';
import { Type } from 'class-transformer';
@ApiExtraModels(PhoneNumberTypeDto)
export class UpdateCompanyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type((): typeof PhoneNumberTypeDto => PhoneNumberTypeDto)
  phoneNumber?: PhoneNumberTypeDto | null;

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

  @ApiProperty({ required: false, enum: StatesAbbreviation })
  @IsOptional()
  @IsEnum(StatesAbbreviation)
  state?: StatesAbbreviation;

  @ApiProperty({ required: false })
  @IsNumberString()
  @IsOptional()
  zipCode?: string;
}
