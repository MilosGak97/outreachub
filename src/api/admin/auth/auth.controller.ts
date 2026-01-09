import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignInDto } from './dto/sign-in-admin.dto';
import { Request, Response } from 'express';
import { PasswordResetDto } from './dto/password-reset.dto';
import { GetAdmin } from './get-admin.decorator';
import { Admin } from 'src/api/entities/admin.entity';
import { MessageResponseDto } from 'src/api/responses/message-response.dto';
import { AdminAuthGuard } from './admin-auth.guard';
import { WhoAmIDto } from './dto/who-am-i.dto';

@ApiTags('auth')
@Controller('admin/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // new endpoint
  @Get('email')
  @ApiOperation({ summary: 'Verify user email with JWT Token' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Expired or invalid token',
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async verifyEmail(
    @Query('jwtToken') token: string,
    @Res() res: Response,
  ): Promise<MessageResponseDto> {
    const { accessToken, refreshToken } =
      await this.authService.verifyEmail(token);

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

    return {
      message: 'Email is verified.',
    };
  }

  // new endpoint
  @Post()
  @ApiOperation({ summary: 'Sign in admin end point' })
  @ApiOkResponse({ type: MessageResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async signIn(
    @Body() signInAdminDto: SignInDto,
    @Res() res: Response,
  ): Promise<Response<MessageResponseDto>> {
    const { accessToken, refreshToken } =
      await this.authService.signIn(signInAdminDto);

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

    const message = 'Login successfull!';
    // Return the LoginResponse directly
    return res.json({ message });
  }

  // new endpoint
  @Delete()
  @ApiOperation({ summary: 'Logout user and delete refresh and access token' })
  @ApiOkResponse({ type: MessageResponseDto })
  @UseGuards(AdminAuthGuard)
  async logout(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response<MessageResponseDto>> {
    const token = req.cookies['accessToken'];
    const removedRefreshToken = await this.authService.logout(token);

    if (!removedRefreshToken) {
      throw new NotFoundException('Could not find refresh token in database');
    }

    // Clear the cookies with SameSite and Secure attributes
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true, // Secure only in production
      sameSite: 'none',
    });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true, // Secure only in production
      sameSite: 'none',
    });

    const message = 'Logout successfull!';
    return res.json({ message });
  }

  // new end point
  @Post('password')
  @ApiOperation({
    summary:
      'Change logged admin password, no old password needed for the initial ',
  })
  @ApiOkResponse({ type: MessageResponseDto })
  @UseGuards(AdminAuthGuard)
  async passwordReset(
    @Body() passwordResetDto: PasswordResetDto,
    @GetAdmin() admin: Admin,
  ): Promise<MessageResponseDto> {
    return this.authService.passwordReset(passwordResetDto, admin);
  }

  // new end point
  @Get('who-am-i')
  @ApiOperation({ summary: 'Get information about logged user' })
  @ApiOkResponse({ type: WhoAmIDto })
  async whoAmI(@Req() req: Request): Promise<WhoAmIDto> {
    const token = req.cookies['accessToken'];
    console.log('token: ', token)
    return await this.authService.whoAmI(token);
  }

  // new endpoint
  @Post('token')
  @ApiOperation({ summary: 'Refresh Access Token' })
  @ApiOkResponse({ type: MessageResponseDto })
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
