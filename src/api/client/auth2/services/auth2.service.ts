import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { User } from '../../../entities/user.entity';
import { Company } from '../../../entities/company.entity';
import { TokenType } from '../../../enums/token/token-type.enum';
import { UserStatus } from '../../../enums/user/user-status.enum';
import { UserRole } from '../../../enums/user/user-role.enum';
import { UserType } from '../../../enums/user/user-type.enum';
import { Token2Service, TokenPair } from './token2.service';
import { EmailService } from '../../../email/email.service';
import {
  RegisterDto2,
  LoginDto,
  VerifyEmailDto,
  SetupCompanyDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
} from '../dto/requests';
import {
  AuthResponseDto,
  UserResponseDto,
  MeResponseDto,
} from '../dto/responses';

@Injectable()
export class Auth2Service {
  private readonly userRepo: Repository<User>;
  private readonly companyRepo: Repository<Company>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
    private readonly token2Service: Token2Service,
    private readonly emailService: EmailService,
  ) {
    this.userRepo = dataSource.getRepository(User);
    this.companyRepo = dataSource.getRepository(Company);
  }

  /**
   * Register a new user with email and password
   * User is created with PENDING_VERIFICATION status
   */
  async register(dto: RegisterDto2): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, phoneCountryCode, phoneNumber } = dto;

    // Check if email already exists
    const existingUser = await this.userRepo.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('An account with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate 6-digit passcode for email verification
    const passcode = randomInt(100000, 999999).toString();
    const hashedPasscode = await bcrypt.hash(passcode, 10);

    // Create user (HEAD role = company owner, USER type = self-registered user)
    const user = this.userRepo.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneCountryCode,
      phoneNumber,
      passcode: hashedPasscode,
      emailVerified: false,
      status: UserStatus.PENDING_VERIFICATION,
      role: UserRole.HEAD,
      userType: UserType.USER,
    });

    await this.userRepo.save(user);

    // Generate tokens
    const tokens = this.token2Service.generateTokenPair(user.id);
    await this.token2Service.saveTokens(user.id, tokens);

    // Create email verification token
    const verificationToken = await this.token2Service.createEmailVerificationToken(user.id);
    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/verify-email/${verificationToken}`;

    // Send verification email
    await this.emailService.userSignUp(email, verifyUrl, passcode);

    return {
      user: this.toUserResponse(user),
      ...tokens,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  /**
   * Login with email and password
   */
  async login(dto: LoginDto): Promise<AuthResponseDto> {
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

    // Generate tokens
    const tokens = this.token2Service.generateTokenPair(user.id, user.company?.id);
    await this.token2Service.saveTokens(user.id, tokens);

    return {
      user: this.toUserResponse(user),
      ...tokens,
    };
  }

  /**
   * Verify email with passcode or token
   */
  async verifyEmail(dto: VerifyEmailDto, userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    // Try passcode verification first
    if (dto.passcode) {
      const isPasscodeValid = await bcrypt.compare(dto.passcode, user.passcode || '');
      if (!isPasscodeValid) {
        throw new BadRequestException('Invalid verification code');
      }
    } else if (dto.token) {
      // Token-based verification
      const validation = await this.token2Service.validateToken(dto.token, TokenType.EMAIL_VERIFICATION);
      if (!validation.valid || validation.userId !== userId) {
        throw new BadRequestException('Invalid or expired verification link');
      }
      await this.token2Service.markEmailVerificationUsed(dto.token);
    } else {
      throw new BadRequestException('Please provide either a passcode or verification token');
    }

    // Mark email as verified and update status
    user.emailVerified = true;
    user.passcode = null;
    if (user.status === UserStatus.PENDING_VERIFICATION) {
      user.status = UserStatus.ACTIVE;
    }

    await this.userRepo.save(user);

    return { message: 'Email verified successfully' };
  }

  /**
   * Resend email verification
   */
  async resendVerification(userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      return { message: 'Email already verified' };
    }

    // Generate new passcode
    const passcode = randomInt(100000, 999999).toString();
    user.passcode = await bcrypt.hash(passcode, 10);
    await this.userRepo.save(user);

    // Create new verification token
    const verificationToken = await this.token2Service.createEmailVerificationToken(user.id);
    const verifyUrl = `${this.configService.get('FRONTEND_URL')}/verify-email/${verificationToken}`;

    // Send verification email
    await this.emailService.resendEmailVerification(user.email, verifyUrl, passcode);

    return { message: 'Verification email sent' };
  }

  /**
   * Setup company for a user
   */
  async setupCompany(dto: SetupCompanyDto, user: User): Promise<MeResponseDto> {
    if (user.company) {
      throw new ConflictException('You already have a company');
    }

    // Create company with fields from the DTO
    const company = this.companyRepo.create({
      name: dto.name,
      website: dto.website,
    });

    await this.companyRepo.save(company);

    // Update user with company
    user.company = company;
    await this.userRepo.save(user);

    // Generate new tokens with company ID
    const tokens = this.token2Service.generateTokenPair(user.id, company.id);
    await this.token2Service.saveTokens(user.id, tokens);

    return {
      user: this.toUserResponse(user),
      ...tokens,
    };
  }

  /**
   * Initiate password reset
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email: dto.email } });

    // Always return success message to prevent email enumeration
    if (!user) {
      return { message: 'If an account exists with this email, you will receive a password reset link.' };
    }

    // Create password reset token
    const resetToken = await this.token2Service.createPasswordResetToken(user.id);
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password/${resetToken}`;

    // Send reset email
    await this.emailService.sendPasswordResetEmail(user.email, resetUrl);

    return { message: 'If an account exists with this email, you will receive a password reset link.' };
  }

  /**
   * Reset password with token
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const validation = await this.token2Service.validateToken(dto.token, TokenType.FORGOT_PASSWORD);

    if (!validation.valid || !validation.userId) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    const user = await this.userRepo.findOne({ where: { id: validation.userId } });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    // Hash new password
    user.password = await bcrypt.hash(dto.password, 10);
    await this.userRepo.save(user);

    // Mark token as used
    await this.token2Service.markPasswordResetUsed(dto.token);

    // Invalidate all existing tokens for security
    await this.token2Service.invalidateAllUserTokens(user.id);

    return { message: 'Password reset successfully. Please log in with your new password.' };
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
    // await this.token2Service.invalidateAllUserTokens(userId);

    return { message: 'Password changed successfully' };
  }

  /**
   * Get current user info
   */
  async getMe(user: User): Promise<MeResponseDto> {
    // Reload with fresh relations if needed
    const freshUser = await this.userRepo.findOne({
      where: { id: user.id },
      relations: ['company'],
    });

    return {
      user: this.toUserResponse(freshUser || user),
    };
  }

  /**
   * Logout - invalidate tokens
   */
  async logout(accessToken: string, refreshToken?: string): Promise<{ message: string }> {
    await this.token2Service.invalidateToken(accessToken);
    if (refreshToken) {
      await this.token2Service.invalidateToken(refreshToken);
    }
    return { message: 'Logged out successfully' };
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string): Promise<{ message: string }> {
    await this.token2Service.invalidateAllUserTokens(userId);
    return { message: 'Logged out from all devices' };
  }

  /**
   * Refresh access token
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const tokens = await this.token2Service.refreshTokens(refreshToken);
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
