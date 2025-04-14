import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../enums/user-role.enum';
import { UserStatus } from '../../../enums/user-status.enum';
import { IsOptional } from 'class-validator';
import { PhoneNumberTypeDto } from '../../../common/dto/phone-number-type.dto';

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
  phoneNumber: PhoneNumberTypeDto;

  @ApiProperty({ type: 'enum', enum: UserRole })
  role: UserRole;

  @ApiProperty({ type: 'enum', enum: UserStatus })
  status: UserStatus;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  @IsOptional()
  companyId: string;
}
