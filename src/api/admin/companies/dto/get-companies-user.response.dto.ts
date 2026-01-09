import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../enums/user/user-role.enum';
import { UserStatus } from '../../../enums/user/user-status.enum';
import { IsEnum, IsOptional } from 'class-validator';
import { PhoneNumberTypeDto } from '../../../common/phone/dto/phone-number-type.dto';
import { Type } from 'class-transformer';

export class GetCompaniesUserResponseDto {
  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phoneNumber: string

  @ApiProperty()
  @Type((): typeof PhoneNumberTypeDto => PhoneNumberTypeDto)
  phoneNumberPrefix: PhoneNumberTypeDto;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty({ enum: UserRole, enumName: 'UserRole' })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ enum: UserStatus, enumName: 'UserStatus' })
  @IsEnum(UserStatus)
  status: UserStatus;
}
