import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '../../../enums/admin/admin-role.enum';
import { AdminStatus } from '../../../enums/admin/admin-status.enum';
import { IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PhoneNumberTypeDto } from '../../../common/phone/dto/phone-number-type.dto';

export class AdminResponseDto {
  @ApiProperty()
  @IsString()
  id: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  phoneNumber: string

  @ApiProperty()
  @Type((): typeof PhoneNumberTypeDto => PhoneNumberTypeDto)
  phonePrefix: PhoneNumberTypeDto;

  @ApiProperty({ enum: AdminRole, enumName: 'AdminRole' })
  @IsEnum(AdminRole)
  role: AdminRole;

  @ApiProperty({ enum: AdminStatus, enumName: 'AdminStatus' })
  @IsEnum(AdminStatus)
  status: AdminStatus;
}
