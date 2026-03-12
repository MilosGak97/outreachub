import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UserRepository } from '../../../repositories/postgres/users.repository';
import { CompanyRepository } from '../../../repositories/postgres/company.repository';
import { User } from '../../../entities/user.entity';
import { UserStatus } from '../../../enums/user/user-status.enum';
import { TokenService, TokenPair } from './token.service';
import { EmailService } from '../../../email/email.service';
import {
  AUTH_SESSION_TOKEN_PREFIX,
  EMAIL_VERIFICATION,
  RESET_PASSWORD_SESSION,
} from '../constants/auth.constants';
import { AuthErrorCode } from '../../../enums/auth/auth-error-code.enum';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  UpdateCompanyProfileDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyResetPasswordDto,
} from '../dto/requests';
import {
  UserResponseDto,
  CompanyResponseDto,
  LoginResponseDto,
  TokenPairResponseDto,
  VerificationTokenResponseDto,
  ResendVerificationResponseDto,
  VerificationStatusResponseDto,
  ResetPasswordStatusResponseDto,
  ResetPasswordTokenResponseDto,
  ResendResetPasswordResponseDto,
  VerifyResetPasswordResponseDto,
  ResetPasswordResponseDto,
} from '../dto/responses';
import {
  startVerificationForUser,
  getUserByVerificationTokenOrThrow,
  ensureVerificationTokenValidOrThrow,
  getUserByResetTokenOrThrow,
  ensureResetTokenValidOrThrow,
  hasStoredPassword,
  generateNumericCode,
  getRetryAfterSeconds,
  getExpiresInSeconds,
  throwAuthError,
} from './auth.helpers';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {}

  // ==================== Authentication ====================

  async register(dto: RegisterDto): Promise<VerificationTokenResponseDto> {
    const { email, password, firstName, lastName, companyName } = dto;

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const company = await this.companyRepository.createAuthCompany(companyName);
    const user = await this.userRepository.createAuthUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      company,
    });

    return startVerificationForUser(user, 'signup', this.userRepository, this.emailService);
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = dto;

    const user = await this.userRepository.findByEmailWithCompany(email);

    if (!user || !hasStoredPassword(user.password)) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }
    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('This account has been deleted.');
    }

    if (!user.emailVerified || user.status === UserStatus.NEW_REGISTER) {
      const now = new Date();
      const tokenExpired =
        !user.verificationToken ||
        !user.verificationTokenExpiresAt ||
        user.verificationTokenExpiresAt < now;

      if (tokenExpired) {
        const verificationContext = await startVerificationForUser(user, 'verify', this.userRepository, this.emailService);
        return { error: AuthErrorCode.EMAIL_NOT_VERIFIED, ...verificationContext };
      }

      const retryAfter = getRetryAfterSeconds(
        user.passcodeExpiresAt,
        EMAIL_VERIFICATION.CODE_EXPIRY_MINUTES,
        EMAIL_VERIFICATION.RESEND_COOLDOWN_SECONDS,
      );

      const codeExpired = !user.passcodeExpiresAt || user.passcodeExpiresAt < now;
      if (codeExpired && retryAfter === 0) {
        const passcode = generateNumericCode(EMAIL_VERIFICATION.CODE_LENGTH);
        user.passcode = await bcrypt.hash(passcode, 10);
        user.passcodeExpiresAt = new Date(
          now.getTime() + EMAIL_VERIFICATION.CODE_EXPIRY_MINUTES * 60 * 1000,
        );
        await this.userRepository.save(user);
        await this.emailService.resendEmailVerification(
          user.email,
          passcode,
          EMAIL_VERIFICATION.TOKEN_EXPIRY_MINUTES,
        );
      }

      return {
        error: AuthErrorCode.EMAIL_NOT_VERIFIED,
        verificationToken: user.verificationToken,
        retryAfter,
      };
    }

    const tokens = this.tokenService.generateTokenPair(user.id, user.company?.id);
    await this.tokenService.saveTokens(user.id, tokens);
    return { ...tokens };
  }

  async logout(accessToken: string, refreshToken?: string): Promise<{ message: string }> {
    await this.tokenService.invalidateToken(accessToken);
    if (refreshToken) {
      await this.tokenService.invalidateToken(refreshToken);
    }
    return { message: 'Logged out successfully' };
  }

  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.tokenService.invalidateAllUserTokens(userId);
    return { message: 'Logged out from all devices' };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const payload = this.tokenService.verifyToken(refreshToken);
    if (!payload?.userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
      relations: ['company'],
    });

    if (!user || !user.emailVerified || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = await this.tokenService.refreshTokens(refreshToken);
    if (!tokens) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    return tokens;
  }

  // ==================== Email Verification ====================

  async getVerificationStatus(verificationToken: string): Promise<VerificationStatusResponseDto> {
   // console.log('USER:', this.userRepository);
    const user = await getUserByVerificationTokenOrThrow(verificationToken, this.userRepository);
    console.log(user.id)
    await ensureVerificationTokenValidOrThrow(user, this.userRepository);
    return {
      retryAfter: getRetryAfterSeconds(
        user.passcodeExpiresAt,
        EMAIL_VERIFICATION.CODE_EXPIRY_MINUTES,
        EMAIL_VERIFICATION.RESEND_COOLDOWN_SECONDS,
      ),
      expiresIn: getExpiresInSeconds(user.verificationTokenExpiresAt),
      email: user.email,
    };
  }

  async verifyEmail(
    verificationToken: string,
    dto: VerifyEmailDto,
  ): Promise<TokenPairResponseDto> {
    const user = await getUserByVerificationTokenOrThrow(verificationToken, this.userRepository);
    await ensureVerificationTokenValidOrThrow(user, this.userRepository);

    const isPasscodeValid = await bcrypt.compare(dto.code, user.passcode || '');
    if (!isPasscodeValid || !user.passcodeExpiresAt || user.passcodeExpiresAt < new Date()) {
      throwAuthError(
        AuthErrorCode.INVALID_VERIFICATION_CODE,
        'The verification code is incorrect.',
      );
    }

    user.emailVerified = true;
    user.passcode = null;
    user.passcodeExpiresAt = null;
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;
    if (user.status === UserStatus.NEW_REGISTER) {
      user.status = UserStatus.ACTIVE;
    }
    await this.userRepository.save(user);

    const tokens = this.tokenService.generateTokenPair(user.id, user.company?.id);
    await this.tokenService.saveTokens(user.id, tokens);
    return tokens;
  }

  async resendVerification(
    verificationToken: string,
  ): Promise<ResendVerificationResponseDto> {
    const user = await getUserByVerificationTokenOrThrow(verificationToken, this.userRepository);
    await ensureVerificationTokenValidOrThrow(user, this.userRepository);

    const retryAfter = getRetryAfterSeconds(
      user.passcodeExpiresAt,
      EMAIL_VERIFICATION.CODE_EXPIRY_MINUTES,
      EMAIL_VERIFICATION.RESEND_COOLDOWN_SECONDS,
    );

    if (retryAfter > 0) {
      throwAuthError(
        AuthErrorCode.RESEND_TOO_SOON,
        `You can request a new code in ${retryAfter} seconds.`,
        HttpStatus.BAD_REQUEST,
        { retryAfter },
      );
    }

    const passcode = generateNumericCode(EMAIL_VERIFICATION.CODE_LENGTH);
    user.passcode = await bcrypt.hash(passcode, 10);
    user.passcodeExpiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION.CODE_EXPIRY_MINUTES * 60 * 1000,
    );
    await this.userRepository.save(user);
    await this.emailService.resendEmailVerification(
      user.email,
      passcode,
      EMAIL_VERIFICATION.TOKEN_EXPIRY_MINUTES,
    );

    return {
      retryAfter: EMAIL_VERIFICATION.RESEND_COOLDOWN_SECONDS,
      message: 'A new verification code has been sent.',
    };
  }

  // ==================== Password Management ====================

  async forgotPassword(dto: ForgotPasswordDto): Promise<ResetPasswordTokenResponseDto> {
    const message =
      'If an account exists with this email, you will receive a password reset code.';

    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || !user.emailVerified) {
      return { message };
    }

    const resetPasswordToken = `${AUTH_SESSION_TOKEN_PREFIX.RESET_PASSWORD}${randomBytes(24).toString('hex')}`;
    const now = new Date();
    const passcode = generateNumericCode(RESET_PASSWORD_SESSION.CODE_LENGTH);

    user.verificationToken = resetPasswordToken;
    user.verificationTokenExpiresAt = new Date(
      now.getTime() + RESET_PASSWORD_SESSION.TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );
    user.passcode = await bcrypt.hash(passcode, 10);
    user.passcodeExpiresAt = new Date(
      now.getTime() + RESET_PASSWORD_SESSION.TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );
    await this.userRepository.save(user);
    await this.emailService.sendPasswordResetEmail(user.email, passcode);

    return { resetPasswordToken, message };
  }

  async getResetPasswordStatus(
    resetPasswordToken: string,
  ): Promise<ResetPasswordStatusResponseDto> {
    const user = await getUserByResetTokenOrThrow(resetPasswordToken, this.userRepository);
    await ensureResetTokenValidOrThrow(user, this.userRepository);
    return {
      retryAfter: getRetryAfterSeconds(
        user.passcodeExpiresAt,
        RESET_PASSWORD_SESSION.TOKEN_EXPIRY_MINUTES,
        RESET_PASSWORD_SESSION.RESEND_COOLDOWN_SECONDS,
      ),
      expiresIn: getExpiresInSeconds(user.verificationTokenExpiresAt),
      email: user.email,
    };
  }

  async verifyResetPassword(
    resetPasswordToken: string,
    dto: VerifyResetPasswordDto,
  ): Promise<VerifyResetPasswordResponseDto> {
    const user = await getUserByResetTokenOrThrow(resetPasswordToken, this.userRepository);
    await ensureResetTokenValidOrThrow(user, this.userRepository);

    const isPasscodeValid = await bcrypt.compare(dto.code, user.passcode || '');
    if (!isPasscodeValid || !user.passcodeExpiresAt || user.passcodeExpiresAt < new Date()) {
      throwAuthError(AuthErrorCode.INVALID_RESET_CODE, 'The reset code is incorrect.');
    }

    return { message: 'Reset code verified.' };
  }

  async resendResetPassword(
    resetPasswordToken: string,
  ): Promise<ResendResetPasswordResponseDto> {
    const user = await getUserByResetTokenOrThrow(resetPasswordToken, this.userRepository);
    await ensureResetTokenValidOrThrow(user, this.userRepository);

    const retryAfter = getRetryAfterSeconds(
      user.passcodeExpiresAt,
      RESET_PASSWORD_SESSION.TOKEN_EXPIRY_MINUTES,
      RESET_PASSWORD_SESSION.RESEND_COOLDOWN_SECONDS,
    );

    if (retryAfter > 0) {
      throwAuthError(
        AuthErrorCode.RESEND_TOO_SOON,
        `You can request a new code in ${retryAfter} seconds.`,
        HttpStatus.BAD_REQUEST,
        { retryAfter },
      );
    }

    const passcode = generateNumericCode(RESET_PASSWORD_SESSION.CODE_LENGTH);
    user.passcode = await bcrypt.hash(passcode, 10);
    user.passcodeExpiresAt = new Date(
      Date.now() + RESET_PASSWORD_SESSION.TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );
    await this.userRepository.save(user);
    await this.emailService.sendPasswordResetEmail(user.email, passcode);

    return {
      retryAfter: RESET_PASSWORD_SESSION.RESEND_COOLDOWN_SECONDS,
      message: 'A new reset code has been sent.',
    };
  }

  async resetPassword(
    resetPasswordToken: string,
    dto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    const user = await getUserByResetTokenOrThrow(resetPasswordToken, this.userRepository);
    await ensureResetTokenValidOrThrow(user, this.userRepository);

    const isPasscodeValid = await bcrypt.compare(dto.code, user.passcode || '');
    if (!isPasscodeValid || !user.passcodeExpiresAt || user.passcodeExpiresAt < new Date()) {
      throwAuthError(AuthErrorCode.INVALID_RESET_CODE, 'The reset code is incorrect.');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.passcode = null;
    user.passcodeExpiresAt = null;
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;
    await this.userRepository.save(user);
    await this.tokenService.invalidateAllUserTokens(user.id);

    return { message: 'Password reset successfully.' };
  }

  async changePassword(dto: ChangePasswordDto, userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!hasStoredPassword(user.password)) {
      throw new BadRequestException('Current password is incorrect');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  // ==================== User & Company Profile ====================

  async getMe(user: User): Promise<UserResponseDto> {
    const freshUser = await this.userRepository.findOne({
      where: { id: user.id },
      relations: ['company'],
    });
    const u = freshUser || user;
    return {
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      phoneCountryCode: u.phoneCountryCode ?? undefined,
      phoneNumber: u.phoneNumber ?? undefined,
      emailVerified: u.emailVerified,
      status: u.status,
      role: u.role,
      userType: u.userType,
      company: u.company ? { id: u.company.id, name: u.company.name } : undefined,
      createdAt: u.created_at,
    };
  }

  async updateCompanyProfile(dto: UpdateCompanyProfileDto, user: User): Promise<CompanyResponseDto> {
    const company = user.company;
    if (dto.name !== undefined) company.name = dto.name;
    if (dto.website !== undefined) company.website = dto.website;
    if (dto.phoneCountryCode !== undefined) company.phoneCountryCode = dto.phoneCountryCode;
    if (dto.phoneNumber !== undefined) company.phoneNumber = dto.phoneNumber;
    if (dto.email !== undefined) company.email = dto.email;
    if (dto.logoUrl !== undefined) company.logoUrl = dto.logoUrl;
    await this.companyRepository.save(company);
    return {
      id: company.id,
      name: company.name,
      website: company.website,
      phoneCountryCode: company.phoneCountryCode,
      phoneNumber: company.phoneNumber,
      email: company.email,
      logoUrl: company.logoUrl,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
    };
  }

}
