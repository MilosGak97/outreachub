import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PhoneNumberTypeDto } from '../../../common/dto/phone-number-type.dto';
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
  @IsOptional()
  @Type((): typeof PhoneNumberTypeDto => PhoneNumberTypeDto)
  phoneNumber: PhoneNumberTypeDto;
}