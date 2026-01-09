import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { PhoneNumberTypeDto } from '../../../common/phone/dto/phone-number-type.dto';
import { Type } from 'class-transformer';

export class RegisterDetailsDto{
  @ApiProperty({required: true})
  @IsNotEmpty()
  @Type((): StringConstructor => String)
  @IsString()
  firstName: string;

  @ApiProperty({required: true})
  @IsNotEmpty()
  @Type((): StringConstructor => String)
  @IsString()
  lastName: string;


  @ApiProperty({required: true})
  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  phoneCountryCode: string;

  @ApiProperty({required: true})
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;
}