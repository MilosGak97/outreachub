import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { MessageResponseDto } from 'src/api/responses/message-response.dto';
import { User } from 'src/api/entities/user.entity';
import { SetPasswordDto } from './dto/set-password.dto';
import { GetUser } from './decorators/get-user.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { UserAuthGuard } from './user-auth.guard';
import { PasscodeDto } from './dto/passcode-dto';
import { WhoAmIDto } from './dto/who-am-i.dto';
import { RegisterDetailsDto } from './dto/register-details.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { EmailDto } from './dto/email-dto';
import {
  COOKIE_CONFIG,
  COOKIE_NAMES,
  TOKEN_EXPIRATION_MS,
} from './constants/auth.constants';

@ApiTags('Auth')
@Controller('client/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Sign In endpoint' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post()
  async signIn(
    @Body() signInDto: SignInDto,
    @Res() res: Response,
  ): Promise<Response<MessageResponseDto>> {
    const { accessToken, refreshToken } =
      await this.authService.signIn(signInDto);
    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      ...COOKIE_CONFIG,
      maxAge: TOKEN_EXPIRATION_MS.ACCESS_TOKEN,
    });

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...COOKIE_CONFIG,
      maxAge: TOKEN_EXPIRATION_MS.REFRESH_TOKEN,
    });

    return res.json({
      message: 'Signed in successfully',
    });
  }


  @ApiOperation({ summary: 'Logout endpoint' })
  @ApiOkResponse({ type: MessageResponseDto })
  @UseGuards(UserAuthGuard)
  @Delete()
  async logout(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<MessageResponseDto>> {
    const token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];

    const removeTokens = await this.authService.removeTokens(token);

    if (!removeTokens) {
      throw new BadRequestException('Tokens are not removed from database');
    }
    res.clearCookie(COOKIE_NAMES.REFRESH_TOKEN, COOKIE_CONFIG);
    res.clearCookie(COOKIE_NAMES.ACCESS_TOKEN, COOKIE_CONFIG);

    return res.json({
      message: 'Logged out successfully',
    });
  }

  @ApiOperation({ summary: 'Sign up with email only' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res() res: Response,
  ): Promise<Response<MessageResponseDto>> {
    const { accessToken, refreshToken } =
      await this.authService.register(registerDto);

    if (!accessToken) {
      throw new BadRequestException('User creation failed');
    }

    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      ...COOKIE_CONFIG,
      maxAge: TOKEN_EXPIRATION_MS.ACCESS_TOKEN,
    });

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...COOKIE_CONFIG,
      maxAge: TOKEN_EXPIRATION_MS.REFRESH_TOKEN,
    });

    return res.json({ message: 'User is created and signed in' });
  }

  @ApiOperation({ summary: 'Form after password is set up' })
  @ApiOkResponse({ type: MessageResponseDto })
  @UseGuards(UserAuthGuard)
  @Patch('register/details')
  async registerDetails(@Body() registerDetailsDto: RegisterDetailsDto, @GetUser() user: User) {
    return this.authService.registerDetails(registerDetailsDto, user);
  }

  @ApiOperation({ summary:  'Form if companyId is empty'})
  @ApiOkResponse({ type: MessageResponseDto})
  @UseGuards(UserAuthGuard)
  @Post('register/company')
  async registerCompany(@Body() registerCompanyDto: RegisterCompanyDto, @GetUser() user: User){
    return await this.authService.registerCompany(registerCompanyDto, user)
  }




  @ApiOperation({summary: 'Resend email verification'})
  @ApiOkResponse({ type: MessageResponseDto })
  @UseGuards(UserAuthGuard)
  @Post('email')
  async resendEmailVerification(
    @GetUser() user: User
  ): Promise<MessageResponseDto> {
    return await this.authService.resendEmailVerification(user);
  }

  @ApiOperation({ summary: 'Verify email with Passcode' })
  @ApiOkResponse({ type: MessageResponseDto })
  @UseGuards(UserAuthGuard)
  @Post('email/verification/passcode')
  async passcodeVerification(
    @Body() passcodeDto: PasscodeDto,
    @GetUser() user: User,
  ): Promise<MessageResponseDto> {
    return await this.authService.passcodeVerification(passcodeDto, user);
  }

  @ApiOperation({ summary: 'Confirm email from url sent to email and login' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Get('email/verification/:token')
  async emailVerification(
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<Response<MessageResponseDto>> {
    const { refreshToken, accessToken } =
      await this.authService.emailVerification(token);

    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      ...COOKIE_CONFIG,
      maxAge: TOKEN_EXPIRATION_MS.ACCESS_TOKEN,
    });

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...COOKIE_CONFIG,
      maxAge: TOKEN_EXPIRATION_MS.REFRESH_TOKEN,
    });

    return res.json({ message: 'Email verified and logged in successfully' });
  }

  @ApiOperation({ summary: "Set password for UserStatus='NO_PASSWORD' users" })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post('password')
  @UseGuards(UserAuthGuard)
  async setPassword(
    @Body() setPasswordDto: SetPasswordDto,
    @GetUser() user: User,
  ): Promise<MessageResponseDto> {
    return await this.authService.setPassword(setPasswordDto, user);
  }

  @ApiOperation({ summary: 'Forgot Password Request Url' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post('password/forgot')
  async forgotPassword(
    @Body() emailDto: EmailDto,
  ): Promise<MessageResponseDto> {
    return await this.authService.forgotPasswordToken(emailDto);
  }


  @ApiOperation({ summary: 'Forgot Password Url verification' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Get('password/forgot/:token')
  async forgotPasswordVerification(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.forgotPasswordVerification(token);

    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, accessToken, {
      ...COOKIE_CONFIG,
      maxAge: TOKEN_EXPIRATION_MS.ACCESS_TOKEN,
    });

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, refreshToken, {
      ...COOKIE_CONFIG,
      maxAge: TOKEN_EXPIRATION_MS.REFRESH_TOKEN,
    });

    return res.json({
      message: 'You are logged in, now you can change your password',
    });
  }

  @ApiOperation({ summary: 'Get information about logged user' })
  @ApiOkResponse({ type: WhoAmIDto })
  @Get('who-am-i')
  async whoAmI(@Req() req: Request): Promise<WhoAmIDto> {
    const token = req.cookies[COOKIE_NAMES.ACCESS_TOKEN];
    return await this.authService.whoAmI(token);
  }

  @ApiOperation({ summary: 'Refresh Access Token' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post('token')
  async refreshAccesToken(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<MessageResponseDto>> {
    const refreshToken = req.cookies[COOKIE_NAMES.REFRESH_TOKEN];
    if (!refreshToken) {
      throw new NotFoundException('No refresh token found');
    }


    const { newAccessToken, newRefreshToken } =
      await this.authService.refreshAccessToken(refreshToken);

    res.cookie(COOKIE_NAMES.ACCESS_TOKEN, newAccessToken, {
      ...COOKIE_CONFIG,
      maxAge: TOKEN_EXPIRATION_MS.ACCESS_TOKEN,
    });

    res.cookie(COOKIE_NAMES.REFRESH_TOKEN, newRefreshToken, {
      ...COOKIE_CONFIG,
      maxAge: TOKEN_EXPIRATION_MS.REFRESH_TOKEN,
    });

    return res.json({ message: 'Tokens refreshed successfully.' });
  }
}
