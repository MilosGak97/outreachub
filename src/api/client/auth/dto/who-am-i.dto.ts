import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../enums/user/user-role.enum';
import { UserStatus } from '../../../enums/user/user-status.enum';
import { IsOptional } from 'class-validator';
import { PhoneNumberTypeDto } from '../../../common/phone/dto/phone-number-type.dto';
import { Type } from 'class-transformer';

@ApiExtraModels(PhoneNumberTypeDto)
export class WhoAmIDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty()
  @IsOptional()
  phoneNumber: string

  @ApiProperty()
  @IsOptional()
  @Type((): typeof PhoneNumberTypeDto => PhoneNumberTypeDto)
  phoneNumberPrefix: PhoneNumberTypeDto;

  @ApiProperty({ type: 'enum', enum: UserRole, enumName: 'UserRole' })
  role: UserRole;

  @ApiProperty({ type: 'enum', enum: UserStatus, enumName: 'UserStatus' })
  status: UserStatus;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  @IsOptional()
  companyId: string;
}
