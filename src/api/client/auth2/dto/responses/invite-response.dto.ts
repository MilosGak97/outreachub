import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InviteStatus } from '../../../../enums/auth2/invite-status.enum';
import { UserRole } from '../../../../enums/user/user-role.enum';

export class InviteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty({ enum: InviteStatus })
  status: InviteStatus;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  acceptedAt?: Date;
}

export class InviteListResponseDto {
  @ApiProperty({ type: [InviteResponseDto] })
  invites: InviteResponseDto[];
}

export class InviteDetailsResponseDto {
  @ApiProperty({ description: 'Company name the user is being invited to' })
  companyName: string;

  @ApiProperty({ description: 'Name of the person who sent the invite' })
  inviterName: string;

  @ApiProperty({ enum: UserRole, description: 'Role being offered' })
  role: UserRole;

  @ApiProperty({ description: 'Email address the invite was sent to' })
  email: string;

  @ApiProperty({ description: 'Whether the invite is still valid' })
  valid: boolean;

  @ApiPropertyOptional({ description: 'Reason if invite is invalid' })
  invalidReason?: string;
}