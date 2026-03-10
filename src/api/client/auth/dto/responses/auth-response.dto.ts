import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuthErrorCode } from '../../../../enums/auth/auth-error-code.enum';
import { UserResponseDto } from './user-response.dto';

export class AuthResponseDto {
  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;

  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;

  @ApiPropertyOptional({ description: 'Message about next steps (e.g., verification needed)' })
  message?: string;
}

export class MessageResponseDto {
  @ApiProperty()
  message: string;
}

export class SuccessMessageResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;
}

export class RefreshResponseDto {
  @ApiProperty({ description: 'Whether token refresh succeeded' })
  success: boolean;

  @ApiPropertyOptional({ description: 'JWT access token (present when refresh succeeds)' })
  accessToken?: string;

  @ApiPropertyOptional({ description: 'JWT refresh token (present when refresh succeeds)' })
  refreshToken?: string;

  @ApiPropertyOptional({ description: 'Failure message when refresh fails' })
  message?: string;
}

export class VerificationStatusResponseDto {
  @ApiProperty({ description: 'Seconds until another verification code can be requested' })
  retryAfter: number;

  @ApiProperty({ description: 'Seconds until verification session expires' })
  expiresIn: number;

  @ApiProperty({ description: 'Email tied to the verification session' })
  email: string;
}

export class VerificationTokenResponseDto {
  @ApiProperty({ description: 'Verification token for email verification flow' })
  verificationToken: string;

  @ApiPropertyOptional({ description: 'Seconds until another verification code can be requested' })
  retryAfter?: number;
}

export class ResendVerificationResponseDto {
  @ApiProperty({ description: 'Seconds until another verification code can be requested' })
  retryAfter: number;

  @ApiProperty({ description: 'User-friendly message' })
  message: string;
}

export class ResetPasswordTokenResponseDto {
  @ApiPropertyOptional({ description: 'Reset password token for password reset flow. Absent when account does not exist or is not verified.' })
  resetPasswordToken?: string;

  @ApiPropertyOptional({ description: 'User-friendly message' })
  message?: string;
}

export class ResetPasswordStatusResponseDto {
  @ApiProperty({ description: 'Seconds until another reset code can be requested' })
  retryAfter: number;

  @ApiProperty({ description: 'Seconds until reset session expires' })
  expiresIn: number;

  @ApiProperty({ description: 'Email tied to the reset session' })
  email: string;
}

export class ResendResetPasswordResponseDto {
  @ApiProperty({ description: 'Seconds until another reset code can be requested' })
  retryAfter: number;

  @ApiProperty({ description: 'User-friendly message' })
  message: string;
}

export class VerifyResetPasswordResponseDto {
  @ApiProperty({ description: 'User-friendly message' })
  message: string;
}

export class ResetPasswordResponseDto {
  @ApiProperty({ description: 'User-friendly message' })
  message: string;
}

export class TokenPairResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ description: 'JWT refresh token' })
  refreshToken: string;
}

export class LoginResponseDto {
  @ApiPropertyOptional({ enum: AuthErrorCode })
  error?: AuthErrorCode;

  @ApiPropertyOptional()
  verificationToken?: string;

  @ApiPropertyOptional()
  retryAfter?: number;

  @ApiPropertyOptional({ description: 'JWT access token' })
  accessToken?: string;

  @ApiPropertyOptional({ description: 'JWT refresh token' })
  refreshToken?: string;
}
