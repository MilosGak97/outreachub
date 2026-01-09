import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '../../../enums/admin/admin-role.enum';
import { AdminStatus } from '../../../enums/admin/admin-status.enum';
import { PhoneNumberTypeDto } from '../../../common/phone/dto/phone-number-type.dto';
import { IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class WhoAmIDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

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

  @ApiProperty({ type: 'enum', enum: AdminRole, enumName: 'AdminRole' })
  role: AdminRole;

  @ApiProperty({ type: 'enum', enum: AdminStatus, enumName: 'AdminStatus' })
  status: AdminStatus;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  initialPassword: boolean
}
