import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';
import { AuthGuard, CompanyRequiredGuard, EmailVerifiedGuard } from './guards';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../../entities/user.entity';
import { AuthErrorCode } from '../../enums/auth/auth-error-code.enum';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  UpdateCompanyProfileDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyResetPasswordDto,
} from './dto/requests';
import {
  CompanyResponseDto,
  LoginResponseDto,
  MessageResponseDto,
  RefreshResponseDto,
  ResendVerificationResponseDto,
  VerificationStatusResponseDto,
  TokenPairResponseDto,
  UserResponseDto,
  VerificationTokenResponseDto,
  ResetPasswordStatusResponseDto,
  ResetPasswordTokenResponseDto,
  ResendResetPasswordResponseDto,
  VerifyResetPasswordResponseDto,
  ResetPasswordResponseDto,
} from './dto/responses';
import {
  AUTH_COOKIE_NAMES,
  AUTH_COOKIE_CONFIG,
  AUTH_TOKEN_EXPIRY,
} from './constants/auth.constants';
import { ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';


@ApiTags('Auth')
@Controller('client/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  // ==================== Authentication ====================

  @Post('register')
  @ApiOkResponse({ type: VerificationTokenResponseDto })
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOkResponse({ type: LoginResponseDto })
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    const result = await this.authService.login(dto);
    if (result.accessToken && result.refreshToken) {
      this.setAuthCookies(res, result.accessToken, result.refreshToken);
    }
    return result;
  }

  @Post('logout')
  @ApiOkResponse({ type: MessageResponseDto })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    const accessToken = req.cookies[AUTH_COOKIE_NAMES.ACCESS_TOKEN];
    const refreshToken = req.cookies[AUTH_COOKIE_NAMES.REFRESH_TOKEN];

    const result = await this.authService.logout(accessToken, refreshToken);
    this.clearAuthCookies(res);
    return result;
  }

  @Post('logout-all')
  @ApiOkResponse({ type: MessageResponseDto })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    const result = await this.authService.logoutAll(user.id);
    this.clearAuthCookies(res);
    return result;
  }

  @Post('refresh')
  @ApiOkResponse({ type: RefreshResponseDto })
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    const refreshToken = req.cookies[AUTH_COOKIE_NAMES.REFRESH_TOKEN];
    if (!refreshToken) {
      this.clearAuthCookies(res);
      throw new HttpException(
        { success: false, message: 'No refresh token provided' },
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokens = await this.authService.refreshTokens(refreshToken);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return { success: true, ...tokens };
  }

  // ==================== Email Verification ====================

  @Get('verification/status')
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'VerificationToken <token>',
  })
  @ApiOkResponse({ type: VerificationStatusResponseDto })
  @HttpCode(HttpStatus.OK)
  async getVerificationStatus(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    const verificationToken = this.extractSessionToken(
      req,
      'VerificationToken',
      AuthErrorCode.VERIFICATION_TOKEN_INVALID,
      'Invalid verification session.',
    );
    console.log('verificationToken in Controler: ', verificationToken);
    return this.authService.getVerificationStatus(verificationToken);
  }

  @Post('verify')
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'VerificationToken <token>',
  })
  @ApiOkResponse({ type: TokenPairResponseDto })
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Req() req: Request,
    @Body() dto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    const verificationToken = this.extractSessionToken(
      req,
      'VerificationToken',
      AuthErrorCode.VERIFICATION_TOKEN_INVALID,
      'Invalid verification session.',
    );
    const tokens = await this.authService.verifyEmail(verificationToken, dto);
    this.setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    return tokens;
  }

  @Post('verification/resend')
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'VerificationToken <token>',
  })
  @ApiOkResponse({ type: ResendVerificationResponseDto })
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    const verificationToken = this.extractSessionToken(
      req,
      'VerificationToken',
      AuthErrorCode.VERIFICATION_TOKEN_INVALID,
      'Invalid verification session.',
    );
    return this.authService.resendVerification(verificationToken);
  }

  // ==================== Password Management ====================

  @Post('forgot-password')
  @ApiOkResponse({ type: ResetPasswordTokenResponseDto })
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    return this.authService.forgotPassword(dto);
  }

  @Get('reset-password/status')
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'ResetToken <token>',
  })
  @ApiOkResponse({ type: ResetPasswordStatusResponseDto })
  @HttpCode(HttpStatus.OK)
  async getResetPasswordStatus(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    const resetPasswordToken = this.extractSessionToken(
      req,
      'ResetToken',
      AuthErrorCode.RESET_TOKEN_INVALID,
      'Invalid reset session.',
    );
    return this.authService.getResetPasswordStatus(resetPasswordToken);
  }

  @Post('verify-reset-password')
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'ResetToken <token>',
  })
  @ApiOkResponse({ type: VerifyResetPasswordResponseDto })
  @HttpCode(HttpStatus.OK)
  async verifyResetPassword(
    @Req() req: Request,
    @Body() dto: VerifyResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    const resetPasswordToken = this.extractSessionToken(
      req,
      'ResetToken',
      AuthErrorCode.RESET_TOKEN_INVALID,
      'Invalid reset session.',
    );
    return this.authService.verifyResetPassword(resetPasswordToken, dto);
  }

  @Post('reset-password/resend')
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'ResetToken <token>',
  })
  @ApiOkResponse({ type: ResendResetPasswordResponseDto })
  @HttpCode(HttpStatus.OK)
  async resendResetPassword(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    const resetPasswordToken = this.extractSessionToken(
      req,
      'ResetToken',
      AuthErrorCode.RESET_TOKEN_INVALID,
      'Invalid reset session.',
    );
    return this.authService.resendResetPassword(resetPasswordToken);
  }

  @Post('reset-password')
  @ApiHeader({
    name: 'Authorization',
    required: true,
    description: 'ResetToken <token>',
  })
  @ApiOkResponse({ type: ResetPasswordResponseDto })
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Req() req: Request,
    @Body() dto: ResetPasswordDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    const resetPasswordToken = this.extractSessionToken(
      req,
      'ResetToken',
      AuthErrorCode.RESET_TOKEN_INVALID,
      'Invalid reset session.',
    );
    return this.authService.resetPassword(resetPasswordToken, dto);
  }

  @Post('change-password')
  @ApiOkResponse({ type: MessageResponseDto })
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    return this.authService.changePassword(dto, user.id);
  }

  // ==================== User Profile ====================

  @Get('who-am-i')
  @ApiOkResponse({ type: UserResponseDto })
  @UseGuards(AuthGuard)
  async whoAmI(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    return this.authService.getMe(user);
  }

  // ==================== Company Profile ====================

  @Patch('company-profile')
  @ApiOkResponse({ type: CompanyResponseDto })
  @UseGuards(AuthGuard, EmailVerifiedGuard, CompanyRequiredGuard)
  @HttpCode(HttpStatus.OK)
  async updateCompanyProfile(
    @Body() dto: UpdateCompanyProfileDto,
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.setNoStoreHeaders(res);
    return this.authService.updateCompanyProfile(dto, user);
  }

  // ==================== Helper Methods ====================

  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      ...AUTH_COOKIE_CONFIG,
      maxAge: AUTH_TOKEN_EXPIRY.ACCESS_TOKEN_MS,
    });
    res.cookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...AUTH_COOKIE_CONFIG,
      maxAge: AUTH_TOKEN_EXPIRY.REFRESH_TOKEN_MS,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(AUTH_COOKIE_NAMES.ACCESS_TOKEN, AUTH_COOKIE_CONFIG);
    res.clearCookie(AUTH_COOKIE_NAMES.REFRESH_TOKEN, AUTH_COOKIE_CONFIG);
  }

  private setNoStoreHeaders(res: Response) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  private extractSessionToken(
    req: Request,
    scheme: 'VerificationToken' | 'ResetToken',
    errorCode: AuthErrorCode,
    message: string,
  ): string {
    const authorization = req.headers.authorization as string | undefined;
    console.log('Authorization before spliting: ', authorization)


    console.log('HEADERS: ', req.headers);
    if (!authorization) {
      throw new HttpException({ errorCode, message }, HttpStatus.BAD_REQUEST);
    }
    const [prefix, token] = authorization.trim().split(/\s+/);
    console.log('prefix: ', prefix);
    console.log('token: ', token);
    if (prefix !== scheme || !token) {
      throw new HttpException({ errorCode, message }, HttpStatus.BAD_REQUEST);
    }

    return token;
  }
}
