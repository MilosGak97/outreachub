import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../../enums/user/user-status.enum';
import { UserRole } from '../../../../enums/user/user-role.enum';
import { UserType } from '../../../../enums/user/user-type.enum';

export class CompanyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  website?: string;

  @ApiPropertyOptional()
  logoUrl?: string;
}

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiPropertyOptional()
  phoneCountryCode?: string;

  @ApiPropertyOptional()
  phoneNumber?: string;

  @ApiProperty()
  emailVerified: boolean;

  @ApiProperty({ enum: UserStatus })
  status: UserStatus;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: UserType })
  userType: UserType;

  @ApiPropertyOptional({ type: CompanyResponseDto })
  company?: CompanyResponseDto | null;

  @ApiProperty()
  createdAt: Date;
}
