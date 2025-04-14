import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '../../../enums/admin-role.enum';
import { AdminStatus } from '../../../enums/admin-status.enum';
import { PhoneNumberTypeDto } from '../../../common/dto/phone-number-type.dto';

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
  phoneNumber: PhoneNumberTypeDto;

  @ApiProperty({ type: 'enum', enum: AdminRole })
  role: AdminRole;

  @ApiProperty({ type: 'enum', enum: AdminStatus})
  status: AdminStatus;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  initialPassword: boolean
}
