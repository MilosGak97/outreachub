import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from 'src/api/enums/user-role.enum';
import { Type } from 'class-transformer';
import { PhoneNumberTypeDto } from '../../../common/dto/phone-number-type.dto';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;


  @ApiProperty({ required: false })
  @IsOptional()
  @Type((): typeof PhoneNumberTypeDto => PhoneNumberTypeDto)
  phoneNumber?: PhoneNumberTypeDto;

  @ApiProperty({ required: false, enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
