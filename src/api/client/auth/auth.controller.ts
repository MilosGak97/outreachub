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
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { WhoAmIDto } from './dto/who-am-i.dto';
import { RegisterDetailsDto } from './dto/register-details.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';

@ApiTags('Auth')
@Controller('client/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Sign up with email only' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post()
  async register(
    @Body() registerDto: RegisterDto,
    @Res() res: Response,
  ): Promise<Response<MessageResponseDto>> {
    const { accessToken, refreshToken } =
      await this.authService.register(registerDto);

    if (!accessToken) {
      throw new BadRequestException('User creation failed');
    }

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
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

  @ApiOperation({ summary: 'Sign In endpoint' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post('signin')
  async signIn(
    @Body() signInDto: SignInDto,
    @Res() res: Response,
  ): Promise<Response<MessageResponseDto>> {
    const { accessToken, refreshToken } =
      await this.authService.signIn(signInDto);
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
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
    const token = req.cookies['accessToken'];

    const removeTokens = await this.authService.removeTokens(token);

    if (!removeTokens) {
      throw new BadRequestException('Tokens are not removed from database');
    }
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
    });

    return res.json({
      message: 'Logged out successfully',
    });
  }

  @ApiOperation({ summary: 'Verify email with Passcode' })
  @ApiOkResponse({ type: MessageResponseDto })
  @UseGuards(UserAuthGuard)
  @Post('email-verification')
  async passcodeVerification(
    @Body() passcodeDto: PasscodeDto,
    @GetUser() user: User,
  ): Promise<MessageResponseDto> {
    return await this.authService.passcodeVerification(passcodeDto, user);
  }

  @ApiOperation({ summary: 'Confirm email from url sent to email and login' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Get('email-verification/:token')
  async emailVerification(
    @Param('token') token: string,
    @Res() res: Response,
  ): Promise<Response<MessageResponseDto>> {
    const { refreshToken, accessToken } =
      await this.authService.emailVerification(token);

    // Set the HTTP-only cookie for the access token
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: 'none', // Adjust as necessary
      maxAge: 60 * 60 * 1000, // 1 hour for access token
    });

    // Set the HTTP-only cookie for the refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: 'none', // Adjust as necessary
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for refresh token
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
  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    return await this.authService.forgotPasswordToken(forgotPasswordDto);
  }

  @ApiOperation({ summary: 'Forgot Password Url verification' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Get('forgot-password/:token')
  async forgotPasswordVerification(
    @Param('token') token: string,
    @Res() res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.forgotPasswordVerification(token);

    // Set the HTTP-only cookie for the access token
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: 'none', // Adjust as necessary
      maxAge: 60 * 60 * 1000, // 1 hour for access token
    });

    // Set the HTTP-only cookie for the refresh token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: 'none', // Adjust as necessary
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days for refresh token
    });

    return res.json({
      message: 'You are logged in, now you can change your password',
    });
  }

  // new end point
  @ApiOperation({ summary: 'Get information about logged user' })
  @ApiOkResponse({ type: WhoAmIDto })
  @Get('who-am-i')
  async whoAmI(@Req() req: Request): Promise<WhoAmIDto> {
    const token = req.cookies['accessToken'];
    return await this.authService.whoAmI(token);
  }

  // new endpoint
  @ApiOperation({ summary: 'Refresh Access Token' })
  @ApiOkResponse({ type: MessageResponseDto })
  @Post('token')
  async refreshAccesToken(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<MessageResponseDto>> {
    const refreshToken = req.cookies['refreshToken'];
    if (!refreshToken) {
      throw new NotFoundException('No refresh token found');
    }

    const { newAccessToken } =
      await this.authService.refreshAccessToken(refreshToken);

    // Set the HTTP-only cookie for the access token
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: true, // Use secure cookies in production
      sameSite: 'none', // Adjust as necessary
      maxAge: 60 * 60 * 1000, // 1 hour for access token
    });

    return res.json({ message: 'Token is refreshed.' });
  }
}
