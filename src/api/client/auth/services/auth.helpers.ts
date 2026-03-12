import { HttpException, HttpStatus } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';
import { UserRepository } from '../../../repositories/postgres/users.repository';
import { EmailService } from '../../../email/email.service';
import { User } from '../../../entities/user.entity';
import {
  AUTH_SESSION_TOKEN_PREFIX,
  EMAIL_VERIFICATION,
} from '../constants/auth.constants';
import { AuthErrorCode } from '../../../enums/auth/auth-error-code.enum';
import { VerificationTokenResponseDto } from '../dto/responses';

export async function startVerificationForUser(
  user: User,
  emailTemplate: 'signup' | 'verify',
  userRepository: UserRepository,
  emailService: EmailService,
): Promise<VerificationTokenResponseDto> {
  const now = new Date();
  const passcode = generateNumericCode(EMAIL_VERIFICATION.CODE_LENGTH);

  user.verificationToken = `${AUTH_SESSION_TOKEN_PREFIX.VERIFICATION}${randomBytes(24).toString('hex')}`;
  user.verificationTokenExpiresAt = new Date(
    now.getTime() + EMAIL_VERIFICATION.TOKEN_EXPIRY_MINUTES * 60 * 1000,
  );
  user.passcode = await bcrypt.hash(passcode, 10);
  user.passcodeExpiresAt = new Date(
    now.getTime() + EMAIL_VERIFICATION.CODE_EXPIRY_MINUTES * 60 * 1000,
  );
  await userRepository.save(user);

  if (emailTemplate === 'signup') {
    await emailService.userSignUp(
      user.email,
      passcode,
      EMAIL_VERIFICATION.TOKEN_EXPIRY_MINUTES,
    );
  }
  else {
    await emailService.resendEmailVerification(
      user.email,
      passcode,
      EMAIL_VERIFICATION.TOKEN_EXPIRY_MINUTES,
    );
  }

  return {
    verificationToken: user.verificationToken,
    retryAfter: EMAIL_VERIFICATION.RESEND_COOLDOWN_SECONDS,
  };
}

export async function getUserByVerificationTokenOrThrow(
  verificationToken: string,
  userRepository: UserRepository,
): Promise<User> {
  if (!verificationToken || !verificationToken.startsWith(AUTH_SESSION_TOKEN_PREFIX.VERIFICATION)) {
    throwAuthError(AuthErrorCode.VERIFICATION_TOKEN_INVALID, 'Invalid verification session.');
  }

  const user = await userRepository.findByVerificationToken(verificationToken);
  if (!user) {
    throwAuthError(AuthErrorCode.VERIFICATION_TOKEN_INVALID, 'Invalid verification session.');
  }
  return user;
}

export async function ensureVerificationTokenValidOrThrow(
  user: User,
  userRepository: UserRepository,
): Promise<void> {
  if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt < new Date()) {
    await userRepository.update(user.id, {
      verificationToken: null,
      verificationTokenExpiresAt: null,
      passcode: null,
      passcodeExpiresAt: null,
    });
    throwAuthError(
      AuthErrorCode.VERIFICATION_TOKEN_EXPIRED,
      'Your verification session has expired.',
      HttpStatus.GONE,
    );
  }
}

export async function getUserByResetTokenOrThrow(
  resetPasswordToken: string,
  userRepository: UserRepository,
): Promise<User> {
  if (!resetPasswordToken || !resetPasswordToken.startsWith(AUTH_SESSION_TOKEN_PREFIX.RESET_PASSWORD)) {
    throwAuthError(AuthErrorCode.RESET_TOKEN_INVALID, 'Invalid reset session.');
  }

  const user = await userRepository.findByVerificationToken(resetPasswordToken);
  if (!user) {
    throwAuthError(AuthErrorCode.RESET_TOKEN_INVALID, 'Invalid reset session.');
  }
  return user;
}

export async function ensureResetTokenValidOrThrow(
  user: User,
  userRepository: UserRepository,
): Promise<void> {
  if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt < new Date()) {
    await userRepository.update(user.id, {
      verificationToken: null,
      verificationTokenExpiresAt: null,
      passcode: null,
      passcodeExpiresAt: null,
    });
    throwAuthError(
      AuthErrorCode.RESET_TOKEN_EXPIRED,
      'Your reset session has expired.',
      HttpStatus.GONE,
    );
  }
}

export function hasStoredPassword(password: User['password']): password is string {
  return typeof password === 'string' && password.length > 0;
}

export function generateNumericCode(length: number): string {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return randomInt(min, max + 1).toString();
}

export function getRetryAfterSeconds(
  passcodeExpiresAt: Date | null | undefined,
  expiryMinutes: number,
  cooldownSeconds: number,
): number {
  if (!passcodeExpiresAt) return 0;
  const sentAt = new Date(passcodeExpiresAt.getTime() - expiryMinutes * 60 * 1000);
  const elapsedSeconds = Math.floor((Date.now() - sentAt.getTime()) / 1000);
  return Math.max(0, cooldownSeconds - elapsedSeconds);
}

export function getExpiresInSeconds(expiresAt: Date | null | undefined): number {
  if (!expiresAt) return 0;
  return Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
}

export function throwAuthError(
  errorCode: AuthErrorCode,
  message: string,
  status: HttpStatus = HttpStatus.BAD_REQUEST,
  extra: Record<string, unknown> = {},
): never {
  throw new HttpException({ errorCode, message, ...extra }, status);
}