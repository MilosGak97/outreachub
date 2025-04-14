import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../enums/user-role.enum';
import { UserStatus } from '../../../enums/user-status.enum';
import { IsEnum, IsOptional } from 'class-validator';
import { PhoneNumberTypeDto } from '../../../common/dto/phone-number-type.dto';
import { Type } from 'class-transformer';

export class CompaniesUsersTypeDto{
  @ApiProperty()
  id:string

  @ApiProperty()
  @IsOptional()
  firstName?: string


  @ApiProperty()
  @IsOptional()
  lastName?: string


  @ApiProperty()
  email: string

  @ApiProperty()
  @IsOptional()
  @Type((): typeof PhoneNumberTypeDto => PhoneNumberTypeDto)
  phoneNumber?: PhoneNumberTypeDto

  @ApiProperty()
  emailVerified: boolean

  @ApiProperty({enum: UserRole})
  @IsEnum(UserRole)
  role: UserRole

  @ApiProperty({enum: UserStatus})
  @IsEnum(UserStatus)
  status: UserStatus


}