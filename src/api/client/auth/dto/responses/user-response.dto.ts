import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '../../../../enums/user/user-status.enum';
import { UserRole } from '../../../../enums/user/user-role.enum';
import { UserType } from '../../../../enums/user/user-type.enum';

export class CompanyResponseDto {
  @ApiProperty({ description: 'Company ID' })
  id: string;

  @ApiProperty({ description: 'Company name' })
  name: string;

  @ApiPropertyOptional({ description: 'Company website URL' })
  website?: string;

  @ApiPropertyOptional({ description: 'Phone country code' })
  phoneCountryCode?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  phoneNumber?: string;

  @ApiPropertyOptional({ description: 'Company email' })
  email?: string;

  @ApiPropertyOptional({ description: 'Company logo URL' })
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Created timestamp' })
  createdAt?: Date;

  @ApiPropertyOptional({ description: 'Updated timestamp' })
  updatedAt?: Date;
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
