import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthRepository } from './auth.repository';
import { RegisterDto } from './dto/register.dto';
import { TokenRepository } from 'src/api/repositories/postgres/token.repository';
import { EmailService } from 'src/api/email/email.service';
import { TokenType } from 'src/api/enums/token-type.enum';
import { TokenResponseDto } from './dto/token-response.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { User } from 'src/api/entities/user.entity';
import { MessageResponseDto } from 'src/api/responses/message-response.dto';
import { SignInDto } from './dto/sign-in.dto';
import { TokenStatus } from 'src/api/enums/token-status.enum';
import { PasscodeDto } from './dto/passcode-dto';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { WhoAmIDto } from './dto/who-am-i.dto';
import { RegisterDetailsDto } from './dto/register-details.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { CompanyRepository } from '../../repositories/postgres/company.repository';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly tokenRepository: TokenRepository,
    private readonly emailService: EmailService,
    private readonly companyRepository: CompanyRepository,
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
      '30d',
    );
    await this.tokenRepository.saveToken(
      user,
      accessToken,
      TokenType.ACCESS,
      '1h',
    );

    // save jwt email verification tokens
    const userId = user.id;
    const expireIn = '432000'; // 5 days
    const jwtToken = await this.authRepository.signJwtToken(userId, expireIn);
    const tokenType = TokenType.EMAIL_VERIFICATION;

    await this.tokenRepository.saveToken(user, jwtToken, tokenType, expireIn);

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

    return await this.companyRepository.registerCompany(registerCompanyDto, user);
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
      '30d',
    );
    await this.tokenRepository.saveToken(
      user,
      accessToken,
      TokenType.ACCESS,
      '1h',
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
      '1h',
    );
    await this.tokenRepository.saveToken(
      user,
      refreshToken,
      TokenType.REFRESH,
      '1d',
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

  async forgotPasswordToken(forgotPasswordDto: ForgotPasswordDto): Promise<{
    message: string;
  }> {
    const { forgotPasswordToken, user } =
      await this.authRepository.forgotPasswordToken(forgotPasswordDto);
    if (forgotPasswordToken == null) {
      return {
        message:
          "Reset password url has been successfully sent if we've found matching email in our database.",
      };
    }
    await this.tokenRepository.saveToken(
      user,
      forgotPasswordToken,
      TokenType.FORGOT_PASSWORD,
      '7d',
    );
    const forgotPasswordUrl = `${process.env.BASE_URL}client/auth/forgot-password/${encodeURIComponent(forgotPasswordToken)}`;
    await this.emailService.forgotPasswordEmail(user.email, forgotPasswordUrl);

    return {
      message:
        "Reset password url has been successfully sent if we've found matching email in our database.",
    };
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

  // new method
  async refreshAccessToken(refreshToken: string): Promise<{
    newAccessToken: string;
  }> {
    return await this.authRepository.refreshAccessToken(refreshToken);
  }
}
