import { BadRequestException, HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { TokenRepository } from 'src/api/repositories/postgres/token.repository';
import { EmailService } from 'src/api/email/email.service';
import { TokenType } from 'src/api/enums/token/token-type.enum';
import { TokenResponseDto } from './dto/token-response.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { User } from 'src/api/entities/user.entity';
import { MessageResponseDto } from 'src/api/responses/message-response.dto';
import { SignInDto } from './dto/sign-in.dto';
import { TokenStatus } from 'src/api/enums/token/token-status.enum';
import { PasscodeDto } from './dto/passcode-dto';
import { WhoAmIDto } from './dto/who-am-i.dto';
import { RegisterDetailsDto } from './dto/register-details.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { CompanyRepository } from '../../repositories/postgres/company.repository';
import { EmailDto } from './dto/email-dto';
import * as bcrypt from 'bcryptjs';
import { randomInt } from 'crypto';
import { TOKEN_EXPIRATION, TOKEN_EXPIRATION_SECONDS } from './constants/auth.constants';
import { TemplateInstallationService } from '../../admin/templates/installation/template-installation.service';
import { DEFAULT_TEMPLATE } from '../../config/default-template.config';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly emailService: EmailService,
    private readonly companyRepository: CompanyRepository,
    private readonly templateInstallationService: TemplateInstallationService,
  ) {}

  async register(registerDto: RegisterDto): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const { user, accessToken, refreshToken, passcode } =
      await this.authRepository.register(registerDto);
    if (!user) {
      throw new BadRequestException('User registration failed');
    }

    // save sign in tokens
    await this.tokenRepository.saveToken(
      user,
      refreshToken,
      TokenType.REFRESH,
      TOKEN_EXPIRATION.REFRESH_TOKEN,
    );
    await this.tokenRepository.saveToken(
      user,
      accessToken,
      TokenType.ACCESS,
      TOKEN_EXPIRATION.ACCESS_TOKEN,
    );

    // save jwt email verification tokens
    const userId = user.id;
    const jwtToken = await this.authRepository.signJwtToken(userId, TOKEN_EXPIRATION.EMAIL_VERIFICATION);
    const tokenType = TokenType.EMAIL_VERIFICATION;

    await this.tokenRepository.saveToken(user, jwtToken, tokenType, TOKEN_EXPIRATION.EMAIL_VERIFICATION);

    const verifyUrl = `${process.env.BASE_URL}client/auth/email-verification/${encodeURIComponent(jwtToken)}`;

    await this.emailService.userSignUp(user.email, verifyUrl, passcode);

    return {
      accessToken,
      refreshToken,
    };
  }

  async registerDetails(registerDetailsDto: RegisterDetailsDto, user:User):Promise<MessageResponseDto>{
    return await this.authRepository.registerDetails(registerDetailsDto, user)
  }

  async registerCompany(registerCompanyDto: RegisterCompanyDto, user: User){
    const company = await this.companyRepository.registerCompany(registerCompanyDto, user);
    await this.templateInstallationService.installTemplate({
      companyId: company.id,
      templateSlug: DEFAULT_TEMPLATE.slug,
      installAllModules: DEFAULT_TEMPLATE.installAllModules,
    });
    return { message: 'Successfully registered company' };
  }
  async removeTokens(token: string): Promise<boolean> {
    const user = await this.authRepository.getUser(token);
    await this.tokenRepository.logoutTokens(user.id);

    return true;
  }

  async signIn(signInDto: SignInDto): Promise<TokenResponseDto> {
    const { refreshToken, accessToken, user } =
      await this.authRepository.signIn(signInDto);

    await this.tokenRepository.saveToken(
      user,
      refreshToken,
      TokenType.REFRESH,
      TOKEN_EXPIRATION.REFRESH_TOKEN,
    );
    await this.tokenRepository.saveToken(
      user,
      accessToken,
      TokenType.ACCESS,
      TOKEN_EXPIRATION.ACCESS_TOKEN,
    );

    return {
      refreshToken,
      accessToken,
    };
  }

  async passcodeVerification(
    passcodeDto: PasscodeDto,
    user: User,
  ): Promise<MessageResponseDto> {
    return await this.authRepository.passcodeVerification(passcodeDto, user.id);
  }

  async emailVerification(token: string): Promise<TokenResponseDto> {
    const tokenStatus = await this.tokenRepository.checkStatus(token);
    if (tokenStatus === TokenStatus.EXPIRED) {
      throw new BadRequestException('Token has been expired');
    }

    if (tokenStatus === TokenStatus.INACTIVE) {
      throw new BadRequestException("Token status has been 'Inactive'");
    }

    const { accessToken, refreshToken, user } =
      await this.authRepository.emailVerification(token);
    await this.tokenRepository.setInactive(token);
    await this.tokenRepository.saveToken(
      user,
      accessToken,
      TokenType.ACCESS,
      TOKEN_EXPIRATION.ACCESS_TOKEN,
    );
    await this.tokenRepository.saveToken(
      user,
      refreshToken,
      TokenType.REFRESH,
      TOKEN_EXPIRATION.REFRESH_TOKEN,
    );

    return {
      accessToken,
      refreshToken,
    };
  }

  async setPassword(
    setPasswordDto: SetPasswordDto,
    user: User,
  ): Promise<MessageResponseDto> {
    return await this.authRepository.setPassword(setPasswordDto, user);
  }

  async forgotPasswordToken(emailDto: EmailDto): Promise<{
    message: string;
  }> {
    const { forgotPasswordToken, user } =
      await this.authRepository.forgotPasswordToken(emailDto);

    // Always return the same message to prevent user enumeration
    const message = "If an account with that email exists, a password reset link has been sent.";

    if (forgotPasswordToken == null) {
      return { message };
    }

    await this.tokenRepository.saveToken(
      user,
      forgotPasswordToken,
      TokenType.FORGOT_PASSWORD,
      TOKEN_EXPIRATION.FORGOT_PASSWORD,
    );
    const forgotPasswordUrl = `${process.env.BASE_URL}client/auth/password/forgot/${encodeURIComponent(forgotPasswordToken)}`;
    await this.emailService.forgotPasswordEmail(user.email, forgotPasswordUrl);

    return { message };
  }

  async resendEmailVerification(user: User){
    if(user.emailVerified === true){
      throw  new BadRequestException("Email verification has been verified already");
    }
    const token = await this.authRepository.resendEmailVerification(user.id);

    const passcode = randomInt(100000, 999999).toString();
    user.passcode = await bcrypt.hash(passcode, 10);
    await this.authRepository.save(user)

    await this.tokenRepository.saveToken(
      user,
      token,
      TokenType.EMAIL_VERIFICATION,
      TOKEN_EXPIRATION.EMAIL_VERIFICATION,
    );

    const url = `${process.env.BASE_URL}client/auth/email/verification/${token}`;

    await this.emailService.resendEmailVerification(user.email, url, passcode);
    return {
      message:
      "Verification email has been sent"
    }
  }

  async forgotPasswordVerification(token: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const tokenStatus = await this.tokenRepository.checkStatus(token);
    if (tokenStatus === TokenStatus.EXPIRED) {
      throw new BadRequestException('Token has been expired');
    }

    if (tokenStatus === TokenStatus.INACTIVE) {
      throw new BadRequestException('Token has been inactive');
    }

    const { accessToken, refreshToken } =
      await this.authRepository.forgotPasswordVerification(token);
    await this.tokenRepository.setInactive(token);

    return { accessToken, refreshToken };
  }

  async whoAmI(token: string): Promise<WhoAmIDto> {
    return await this.authRepository.whoAmI(token);
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    newAccessToken: string;
    newRefreshToken: string;
  }> {
    // Check if refresh token exists in database and is ACTIVE
    const tokenRecord = await this.tokenRepository.findOne({
      where: { token: refreshToken, type: TokenType.REFRESH },
      relations: ['user'],
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (tokenRecord.status !== TokenStatus.ACTIVE) {
      throw new UnauthorizedException('Refresh token is not active');
    }

    if (tokenRecord.expiresAt < new Date()) {
      // Mark as expired
      await this.tokenRepository.update(
        { id: tokenRecord.id },
        { status: TokenStatus.EXPIRED },
      );
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Generate new tokens (with rotation)
    const { newAccessToken, newRefreshToken, user } =
      await this.authRepository.refreshAccessToken(refreshToken);

    // Mark old refresh token as INACTIVE
    await this.tokenRepository.update(
      { id: tokenRecord.id },
      { status: TokenStatus.INACTIVE },
    );

    // Save new tokens to database
    await this.tokenRepository.saveToken(
      user,
      newAccessToken,
      TokenType.ACCESS,
      TOKEN_EXPIRATION.ACCESS_TOKEN,
    );
    await this.tokenRepository.saveToken(
      user,
      newRefreshToken,
      TokenType.REFRESH,
      TOKEN_EXPIRATION.REFRESH_TOKEN,
    );

    return { newAccessToken, newRefreshToken };
  }
}
