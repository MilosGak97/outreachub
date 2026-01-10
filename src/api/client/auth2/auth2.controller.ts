import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Auth2Service } from './services/auth2.service';
import { Token2Service } from './services/token2.service';
import { InviteService } from './services/invite.service';
import { Auth2Guard, OptionalAuth2Guard, CompanyRequiredGuard, EmailVerifiedGuard } from './guards';
import { CurrentUser2 } from './decorators/current-user2.decorator';
import { User } from '../../entities/user.entity';
import {
  RegisterDto2,
  LoginDto,
  VerifyEmailDto,
  SetupCompanyDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  CreateInviteDto,
  AcceptInviteDto,
} from './dto/requests';
import {
  AUTH2_COOKIE_NAMES,
  AUTH2_COOKIE_CONFIG,
  AUTH2_TOKEN_EXPIRY,
} from './constants/auth2.constants';

@Controller('auth2')
export class Auth2Controller {
  constructor(
    private readonly auth2Service: Auth2Service,
    private readonly token2Service: Token2Service,
    private readonly inviteService: InviteService,
  ) {}

  // ==================== Authentication ====================

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto2,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth2Service.register(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth2Service.login(dto);
    this.setAuthCookies(res, result.accessToken, result.refreshToken);
    return result;
  }

  @Post('logout')
  @UseGuards(Auth2Guard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = req.cookies[AUTH2_COOKIE_NAMES.ACCESS_TOKEN];
    const refreshToken = req.cookies[AUTH2_COOKIE_NAMES.REFRESH_TOKEN];

    const result = await this.auth2Service.logout(accessToken, refreshToken);
    this.clearAuthCookies(res);
    return result;
  }

  @Post('logout-all')
  @UseGuards(Auth2Guard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser2() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth2Service.logoutAll(user.id);
    this.clearAuthCookies(res);
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies[AUTH2_COOKIE_NAMES.REFRESH_TOKEN];
    if (!refreshToken) {
      this.clearAuthCookies(res);
      return { success: false, message: 'No refresh token provided' };
    }

    const tokens = await this.auth2Service.refreshTokens(refreshToken);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { success: true, ...tokens };
  }

  // ==================== Email Verification ====================

  @Post('verify-email')
  @UseGuards(Auth2Guard)
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @CurrentUser2() user: User,
  ) {
    return this.auth2Service.verifyEmail(dto, user.id);
  }

  @Post('resend-verification')
  @UseGuards(Auth2Guard)
  @HttpCode(HttpStatus.OK)
  async resendVerification(@CurrentUser2() user: User) {
    return this.auth2Service.resendVerification(user.id);
  }

  // ==================== Password Management ====================

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth2Service.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth2Service.resetPassword(dto);
  }

  @Post('change-password')
  @UseGuards(Auth2Guard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser2() user: User,
  ) {
    return this.auth2Service.changePassword(dto, user.id);
  }

  // ==================== User Profile ====================

  @Get('me')
  @UseGuards(Auth2Guard)
  async getMe(@CurrentUser2() user: User) {
    return this.auth2Service.getMe(user);
  }

  // ==================== Company Setup ====================

  @Post('setup-company')
  @UseGuards(Auth2Guard, EmailVerifiedGuard)
  @HttpCode(HttpStatus.OK)
  async setupCompany(
    @Body() dto: SetupCompanyDto,
    @CurrentUser2() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth2Service.setupCompany(dto, user);
    if (result.accessToken && result.refreshToken) {
      this.setAuthCookies(res, result.accessToken, result.refreshToken);
    }
    return result;
  }

  // ==================== Session Management ====================

  @Get('sessions')
  @UseGuards(Auth2Guard)
  async getSessions(@CurrentUser2() user: User) {
    const sessions = await this.token2Service.getActiveSessions(user.id);
    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        createdAt: s.created_at,
        expiresAt: s.expiresAt,
      })),
    };
  }

  @Delete('sessions/:id')
  @UseGuards(Auth2Guard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Param('id') sessionId: string,
    @CurrentUser2() user: User,
  ) {
    const revoked = await this.token2Service.revokeSession(sessionId, user.id);
    return { success: revoked, message: revoked ? 'Session revoked' : 'Session not found' };
  }

  // ==================== Invite Management ====================

  @Post('invites')
  @UseGuards(Auth2Guard, EmailVerifiedGuard, CompanyRequiredGuard)
  @HttpCode(HttpStatus.CREATED)
  async createInvite(
    @Body() dto: CreateInviteDto,
    @CurrentUser2() user: User,
  ) {
    return this.inviteService.createInvite(dto, user);
  }

  @Get('invites')
  @UseGuards(Auth2Guard, EmailVerifiedGuard, CompanyRequiredGuard)
  async getCompanyInvites(@CurrentUser2() user: User) {
    return this.inviteService.getCompanyInvites(user.company.id);
  }

  @Delete('invites/:id')
  @UseGuards(Auth2Guard, EmailVerifiedGuard, CompanyRequiredGuard)
  @HttpCode(HttpStatus.OK)
  async revokeInvite(
    @Param('id') inviteId: string,
    @CurrentUser2() user: User,
  ) {
    await this.inviteService.revokeInvite(inviteId, user.company.id);
    return { success: true, message: 'Invite revoked' };
  }

  // Public invite endpoints
  @Get('invite/:token')
  async getInviteDetails(@Param('token') token: string) {
    return this.inviteService.getInviteDetails(token);
  }

  @Post('invite/:token/accept')
  @HttpCode(HttpStatus.CREATED)
  async acceptInvite(
    @Param('token') token: string,
    @Body() dto: AcceptInviteDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.inviteService.acceptInvite(token, dto);

    // Generate tokens and set cookies for the new user
    const tokens = this.token2Service.generateTokenPair(user.id, user.company?.id);
    await this.token2Service.saveTokens(user.id, tokens);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        emailVerified: user.emailVerified,
        status: user.status,
        role: user.role,
        userType: user.userType,
      },
      ...tokens,
      message: 'Account created successfully. You are now logged in.',
    };
  }

  // ==================== Helper Methods ====================

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(AUTH2_COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      ...AUTH2_COOKIE_CONFIG,
      maxAge: AUTH2_TOKEN_EXPIRY.ACCESS_TOKEN_MS,
    });
    res.cookie(AUTH2_COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...AUTH2_COOKIE_CONFIG,
      maxAge: AUTH2_TOKEN_EXPIRY.REFRESH_TOKEN_MS,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(AUTH2_COOKIE_NAMES.ACCESS_TOKEN, AUTH2_COOKIE_CONFIG);
    res.clearCookie(AUTH2_COOKIE_NAMES.REFRESH_TOKEN, AUTH2_COOKIE_CONFIG);
  }
}
