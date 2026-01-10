import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from './user-response.dto';

export class MeResponseDto {
  @ApiPropertyOptional({ type: UserResponseDto, description: 'User details' })
  user?: UserResponseDto;

  @ApiPropertyOptional({ description: 'JWT access token (included when tokens are refreshed)' })
  accessToken?: string;

  @ApiPropertyOptional({ description: 'JWT refresh token (included when tokens are refreshed)' })
  refreshToken?: string;

  @ApiPropertyOptional({ description: 'Whether user needs to verify their email' })
  needsEmailVerification?: boolean;

  @ApiPropertyOptional({ description: 'Whether user needs to set up a company' })
  needsCompanySetup?: boolean;
}