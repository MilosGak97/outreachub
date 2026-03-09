import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomBytes, randomInt } from 'crypto';
import { User } from '../../../entities/user.entity';
import { Company } from '../../../entities/company.entity';
import { UserStatus } from '../../../enums/user/user-status.enum';
import { UserRole } from '../../../enums/user/user-role.enum';
import { UserType } from '../../../enums/user/user-type.enum';
import { TokenService, TokenPair } from './token.service';
import { EmailService } from '../../../email/email.service';
import { AUTH_SESSION_TOKEN_PREFIX, EMAIL_VERIFICATION, RESET_PASSWORD_SESSION } from '../constants/auth.constants';
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

@Injectable()
export class AuthService {
  private readonly userRepo: Repository<User>;
  private readonly companyRepo: Repository<Company>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly tokenService: TokenService,
    private readonly emailService: EmailService,
  ) {
    this.userRepo = dataSource.getRepository(User);
    this.companyRepo = dataSource.getRepository(Company);
  }

  /**
   * Register a new user with email and password
   * User is created with NEW_REGISTER status
   * Company is created with just the name
   */
  async register(dto: RegisterDto): Promise<VerificationTokenResponseDto> {
    const { email, password, firstName, lastName, companyName } = dto;

    // Check if email already exists
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create company first with just the name
    const company = this.companyRepo.create({
      name: companyName,
    });
    await this.companyRepo.save(company);

    // Create user with company reference (HEAD role = company owner, USER type = self-registered user)
    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      emailVerified: false,
      status: UserStatus.NEW_REGISTER,
      role: UserRole.HEAD,
      userType: UserType.USER,
      company,
    });

    await this.userRepo.save(user);

    return this.startVerificationForUser(user, 'signup');
  }

  /**
   * Login with email and password
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const { email, password } = dto;

    const user = await this.userRepo.findOne({
      where: { email },
      relations: ['company'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if account is suspended or deleted
    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Your account has been suspended. Please contact support.');
    }
    if (user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('This account has been deleted.');
    }

    if (!user.emailVerified || user.status === UserStatus.NEW_REGISTER) {
      const verificationContext = await this.buildVerificationContext(user);
      return {
        error: AuthErrorCode.EMAIL_NOT_VERIFIED,
        ...verificationContext,
      };
    }

    // Generate tokens
    const tokens = this.tokenService.generateTokenPair(user.id, user.company?.id);
    await this.tokenService.saveTokens(user.id, tokens);

    return {
      ...tokens,
    };
  }

  /**
   * Verify email with verification token + code
   */
  async verifyEmail(
    verificationToken: string,
    dto: VerifyEmailDto,
  ): Promise<TokenPairResponseDto> {
    const user = await this.getUserByVerificationTokenOrThrow(verificationToken);
    this.ensureVerificationTokenValidOrThrow(user);

    const isPasscodeValid = await bcrypt.compare(dto.code, user.passcode || '');
    if (!isPasscodeValid || !user.passcodeExpiresAt || user.passcodeExpiresAt < new Date()) {
      this.throwAuthError(
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
    await this.userRepo.save(user);

    const tokens = this.tokenService.generateTokenPair(user.id, user.company?.id);
    await this.tokenService.saveTokens(user.id, tokens);

    return tokens;
  }

  /**
   * Fetch verification status
   */
  async getVerificationStatus(
    verificationToken: string,
  ): Promise<VerificationStatusResponseDto> {
    const user = await this.getUserByVerificationTokenOrThrow(verificationToken);
    this.ensureVerificationTokenValidOrThrow(user);
    return {
      retryAfter: this.getRetryAfterSeconds(
        user.passcodeExpiresAt,
        EMAIL_VERIFICATION.CODE_EXPIRY_MINUTES,
        EMAIL_VERIFICATION.RESEND_COOLDOWN_SECONDS,
      ),
      expiresIn: this.getExpiresInSeconds(user.verificationTokenExpiresAt),
      email: user.email,
    };
  }

  /**
   * Resend email verification code
   */
  async resendVerification(
    verificationToken: string,
  ): Promise<ResendVerificationResponseDto> {
    const user = await this.getUserByVerificationTokenOrThrow(verificationToken);
    this.ensureVerificationTokenValidOrThrow(user);
    const retryAfter = this.getRetryAfterSeconds(
      user.passcodeExpiresAt,
      EMAIL_VERIFICATION.CODE_EXPIRY_MINUTES,
      EMAIL_VERIFICATION.RESEND_COOLDOWN_SECONDS,
    );

    if (retryAfter > 0) {
      this.throwAuthError(
        AuthErrorCode.RESEND_TOO_SOON,
        `You can request a new code in ${retryAfter} seconds.`,
        HttpStatus.BAD_REQUEST,
        { retryAfter },
      );
    }

    const passcode = this.generateNumericCode(EMAIL_VERIFICATION.CODE_LENGTH);
    user.passcode = await bcrypt.hash(passcode, 10);
    user.passcodeExpiresAt = new Date(
      Date.now() + EMAIL_VERIFICATION.CODE_EXPIRY_MINUTES * 60 * 1000,
    );
    await this.userRepo.save(user);

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

  /**
   * Update company profile
   */
  async updateCompanyProfile(dto: UpdateCompanyProfileDto, user: User): Promise<CompanyResponseDto> {
    const company = user.company;

    // Update only provided fields
    if (dto.name !== undefined) company.name = dto.name;
    if (dto.website !== undefined) company.website = dto.website;
    if (dto.phoneCountryCode !== undefined) company.phoneCountryCode = dto.phoneCountryCode;
    if (dto.phoneNumber !== undefined) company.phoneNumber = dto.phoneNumber;
    if (dto.email !== undefined) company.email = dto.email;
    if (dto.logoUrl !== undefined) company.logoUrl = dto.logoUrl;

    await this.companyRepo.save(company);

    return this.toCompanyResponse(company);
  }

  private generateSessionToken(prefix: string): string {
    return `${prefix}${randomBytes(24).toString('hex')}`;
  }

  private generateVerificationToken(): string {
    return this.generateSessionToken(AUTH_SESSION_TOKEN_PREFIX.VERIFICATION);
  }

  private generateResetToken(): string {
    return this.generateSessionToken(AUTH_SESSION_TOKEN_PREFIX.RESET_PASSWORD);
  }

  private generateNumericCode(length: number): string {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return randomInt(min, max + 1).toString();
  }

  private getCodeSentAt(
    passcodeExpiresAt: Date | null | undefined,
    expiryMinutes: number,
  ): Date | null {
    if (!passcodeExpiresAt) {
      return null;
    }
    return new Date(passcodeExpiresAt.getTime() - expiryMinutes * 60 * 1000);
  }

  private getRetryAfterSeconds(
    passcodeExpiresAt: Date | null | undefined,
    expiryMinutes: number,
    cooldownSeconds: number,
  ): number {
    const sentAt = this.getCodeSentAt(passcodeExpiresAt, expiryMinutes);
    if (!sentAt) {
      return 0;
    }
    const elapsedSeconds = Math.floor((Date.now() - sentAt.getTime()) / 1000);
    return Math.max(0, cooldownSeconds - elapsedSeconds);
  }

  private getExpiresInSeconds(expiresAt: Date | null | undefined): number {
    if (!expiresAt) {
      return 0;
    }
    const diffSeconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    return Math.max(0, diffSeconds);
  }

  private throwAuthError(
    errorCode: AuthErrorCode,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    extra: Record<string, unknown> = {},
  ): never {
    throw new HttpException(
      {
        errorCode,
        message,
        ...extra,
      },
      status,
    );
  }

  private async startVerificationForUser(
    user: User,
    emailTemplate: 'signup' | 'verify',
  ): Promise<VerificationTokenResponseDto> {
    const now = new Date();
    const passcode = this.generateNumericCode(EMAIL_VERIFICATION.CODE_LENGTH);

    user.verificationToken = this.generateVerificationToken();
    user.verificationTokenExpiresAt = new Date(
      now.getTime() + EMAIL_VERIFICATION.TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );
    user.passcode = await bcrypt.hash(passcode, 10);
    user.passcodeExpiresAt = new Date(
      now.getTime() + EMAIL_VERIFICATION.CODE_EXPIRY_MINUTES * 60 * 1000,
    );
    await this.userRepo.save(user);

    if (emailTemplate === 'signup') {
      await this.emailService.userSignUp(
        user.email,
        passcode,
        EMAIL_VERIFICATION.TOKEN_EXPIRY_MINUTES,
      );
    } else {
      await this.emailService.resendEmailVerification(
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

  private async buildVerificationContext(user: User): Promise<VerificationTokenResponseDto> {
    const now = new Date();
    const tokenExpired =
      !user.verificationToken ||
      !user.verificationTokenExpiresAt ||
      user.verificationTokenExpiresAt < now;

    if (tokenExpired) {
      return this.startVerificationForUser(user, 'verify');
    }

    const retryAfter = this.getRetryAfterSeconds(
      user.passcodeExpiresAt,
      EMAIL_VERIFICATION.CODE_EXPIRY_MINUTES,
      EMAIL_VERIFICATION.RESEND_COOLDOWN_SECONDS,
    );

    const codeExpired = !user.passcodeExpiresAt || user.passcodeExpiresAt < now;
    if (codeExpired && retryAfter === 0) {
      const passcode = this.generateNumericCode(EMAIL_VERIFICATION.CODE_LENGTH);
      user.passcode = await bcrypt.hash(passcode, 10);
      user.passcodeExpiresAt = new Date(
        now.getTime() + EMAIL_VERIFICATION.CODE_EXPIRY_MINUTES * 60 * 1000,
      );
      await this.userRepo.save(user);
      await this.emailService.resendEmailVerification(
        user.email,
        passcode,
        EMAIL_VERIFICATION.TOKEN_EXPIRY_MINUTES,
      );
      return {
        verificationToken: user.verificationToken,
        retryAfter: EMAIL_VERIFICATION.RESEND_COOLDOWN_SECONDS,
      };
    }

    return {
      verificationToken: user.verificationToken,
      retryAfter,
    };
  }

  private async getUserByVerificationTokenOrThrow(verificationToken: string): Promise<User> {
    if (!verificationToken || !verificationToken.startsWith(AUTH_SESSION_TOKEN_PREFIX.VERIFICATION)) {
      this.throwAuthError(
        AuthErrorCode.VERIFICATION_TOKEN_INVALID,
        'Invalid verification session.',
      );
    }

    const user = await this.userRepo.findOne({ where: { verificationToken } });
    if (!user) {
      this.throwAuthError(
        AuthErrorCode.VERIFICATION_TOKEN_INVALID,
        'Invalid verification session.',
      );
    }
    return user;
  }

  private async ensureVerificationTokenValidOrThrow(user: User): Promise<void> {
    if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt < new Date()) {
      await this.userRepo.update(user.id, {
        verificationToken: null,
        verificationTokenExpiresAt: null,
        passcode: null,
        passcodeExpiresAt: null,
      });
      this.throwAuthError(
        AuthErrorCode.VERIFICATION_TOKEN_EXPIRED,
        'Your verification session has expired.',
        HttpStatus.GONE,
      );
    }
  }

  private async getUserByResetTokenOrThrow(resetPasswordToken: string): Promise<User> {
    if (!resetPasswordToken || !resetPasswordToken.startsWith(AUTH_SESSION_TOKEN_PREFIX.RESET_PASSWORD)) {
      this.throwAuthError(AuthErrorCode.RESET_TOKEN_INVALID, 'Invalid reset session.');
    }

    const user = await this.userRepo.findOne({ where: { verificationToken: resetPasswordToken } });
    if (!user) {
      this.throwAuthError(AuthErrorCode.RESET_TOKEN_INVALID, 'Invalid reset session.');
    }
    return user;
  }

  private async ensureResetTokenValidOrThrow(user: User): Promise<void> {
    if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt < new Date()) {
      await this.userRepo.update(user.id, {
        verificationToken: null,
        verificationTokenExpiresAt: null,
        passcode: null,
        passcodeExpiresAt: null,
      });
      this.throwAuthError(
        AuthErrorCode.RESET_TOKEN_EXPIRED,
        'Your reset session has expired.',
        HttpStatus.GONE,
      );
    }
  }

  /**
   * Convert Company entity to CompanyResponseDto
   */
  private toCompanyResponse(company: Company): CompanyResponseDto {
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

  /**
   * Initiate password reset — sends OTP via email
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<ResetPasswordTokenResponseDto> {
    const message =
      'If an account exists with this email, you will receive a password reset code.';
    const user = await this.userRepo.findOne({ where: { email: dto.email } });
    const resetPasswordToken = this.generateResetToken();

    if (!user || !user.emailVerified) {
      return { resetPasswordToken, message };
    }

    const now = new Date();
    const passcode = this.generateNumericCode(RESET_PASSWORD_SESSION.CODE_LENGTH);
    user.verificationToken = resetPasswordToken;
    user.verificationTokenExpiresAt = new Date(
      now.getTime() + RESET_PASSWORD_SESSION.TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );
    user.passcode = await bcrypt.hash(passcode, 10);
    user.passcodeExpiresAt = new Date(
      now.getTime() + RESET_PASSWORD_SESSION.TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );
    await this.userRepo.save(user);

    await this.emailService.sendPasswordResetEmail(user.email, passcode);

    return { resetPasswordToken, message };
  }

  /**
   * Fetch reset session status
   */
  async getResetPasswordStatus(
    resetPasswordToken: string,
  ): Promise<ResetPasswordStatusResponseDto> {
    const user = await this.getUserByResetTokenOrThrow(resetPasswordToken);
    await this.ensureResetTokenValidOrThrow(user);
    return {
      retryAfter: this.getRetryAfterSeconds(
        user.passcodeExpiresAt,
        RESET_PASSWORD_SESSION.TOKEN_EXPIRY_MINUTES,
        RESET_PASSWORD_SESSION.RESEND_COOLDOWN_SECONDS,
      ),
      expiresIn: this.getExpiresInSeconds(user.verificationTokenExpiresAt),
      email: user.email,
    };
  }

  /**
   * Verify reset code
   */
  async verifyResetPassword(
    resetPasswordToken: string,
    dto: VerifyResetPasswordDto,
  ): Promise<VerifyResetPasswordResponseDto> {
    const user = await this.getUserByResetTokenOrThrow(resetPasswordToken);
    await this.ensureResetTokenValidOrThrow(user);

    const isPasscodeValid = await bcrypt.compare(dto.code, user.passcode || '');
    if (!isPasscodeValid || !user.passcodeExpiresAt || user.passcodeExpiresAt < new Date()) {
      this.throwAuthError(
        AuthErrorCode.INVALID_RESET_CODE,
        'The reset code is incorrect.',
      );
    }

    return { message: 'Reset code verified.' };
  }

  /**
   * Resend reset code
   */
  async resendResetPassword(
    resetPasswordToken: string,
  ): Promise<ResendResetPasswordResponseDto> {
    const user = await this.getUserByResetTokenOrThrow(resetPasswordToken);
    await this.ensureResetTokenValidOrThrow(user);
    const retryAfter = this.getRetryAfterSeconds(
      user.passcodeExpiresAt,
      RESET_PASSWORD_SESSION.TOKEN_EXPIRY_MINUTES,
      RESET_PASSWORD_SESSION.RESEND_COOLDOWN_SECONDS,
    );

    if (retryAfter > 0) {
      this.throwAuthError(
        AuthErrorCode.RESEND_TOO_SOON,
        `You can request a new code in ${retryAfter} seconds.`,
        HttpStatus.BAD_REQUEST,
        { retryAfter },
      );
    }

    const passcode = this.generateNumericCode(RESET_PASSWORD_SESSION.CODE_LENGTH);
    user.passcode = await bcrypt.hash(passcode, 10);
    user.passcodeExpiresAt = new Date(
      Date.now() + RESET_PASSWORD_SESSION.TOKEN_EXPIRY_MINUTES * 60 * 1000,
    );
    await this.userRepo.save(user);

    await this.emailService.sendPasswordResetEmail(user.email, passcode);

    return {
      retryAfter: RESET_PASSWORD_SESSION.RESEND_COOLDOWN_SECONDS,
      message: 'A new reset code has been sent.',
    };
  }

  /**
   * Reset password with reset token
   */
  async resetPassword(
    resetPasswordToken: string,
    dto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    const user = await this.getUserByResetTokenOrThrow(resetPasswordToken);
    await this.ensureResetTokenValidOrThrow(user);

    const isPasscodeValid = await bcrypt.compare(dto.code, user.passcode || '');
    if (!isPasscodeValid || !user.passcodeExpiresAt || user.passcodeExpiresAt < new Date()) {
      this.throwAuthError(
        AuthErrorCode.INVALID_RESET_CODE,
        'The reset code is incorrect.',
      );
    }

    user.password = await bcrypt.hash(dto.newPassword, 10);
    user.passcode = null;
    user.passcodeExpiresAt = null;
    user.verificationToken = null;
    user.verificationTokenExpiresAt = null;
    await this.userRepo.save(user);

    await this.tokenService.invalidateAllUserTokens(user.id);

    return { message: 'Password reset successfully.' };
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(dto: ChangePasswordDto, userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash and save new password
    user.password = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);

    // Optionally invalidate other sessions
    // await this.tokenService.invalidateAllUserTokens(userId);

    return { message: 'Password changed successfully' };
  }

  /**
   * Get current user info
   */
  async getMe(user: User): Promise<UserResponseDto> {
    // Reload with fresh relations if needed
    const freshUser = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['company'],
    });

    return this.toUserResponse(freshUser || user);
  }

  /**
   * Logout - invalidate tokens
   */
  async logout(accessToken: string, refreshToken?: string): Promise<{ message: string }> {
    await this.tokenService.invalidateToken(accessToken);
    if (refreshToken) {
      await this.tokenService.invalidateToken(refreshToken);
    }
    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.tokenService.invalidateAllUserTokens(userId);
    return { message: 'Logged out from all devices' };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const payload = this.tokenService.verifyToken(refreshToken);
    if (!payload?.userId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.userRepo.findOne({
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

  /**
   * Convert User entity to UserResponseDto
   */
  private toUserResponse(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneCountryCode: user.phoneCountryCode ?? undefined,
      phoneNumber: user.phoneNumber ?? undefined,
      emailVerified: user.emailVerified,
      status: user.status,
      role: user.role,
      userType: user.userType,
      company: user.company
        ? {
            id: user.company.id,
            name: user.company.name,
          }
        : undefined,
      createdAt: user.created_at,
    };
  }
}
