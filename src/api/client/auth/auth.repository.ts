import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from 'src/api/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { RegisterDto } from './dto/register.dto';
import { UserStatus } from 'src/api/enums/user-status.enum';
import { UserType } from 'src/api/enums/user-type.enum';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { JwtPayload } from './dto/jwt-payload.interface';
import { UserRole } from 'src/api/enums/user-role.enum';
import { randomInt } from 'crypto';
import * as bcrypt from 'bcrypt';
import { SetPasswordDto } from './dto/set-password.dto';
import { MessageResponseDto } from 'src/api/responses/message-response.dto';
import { SignInDto } from './dto/sign-in.dto';
import { PasscodeDto } from './dto/passcode-dto';
import { ForgotPasswordDto } from './dto/forgot-password-dto';
import { WhoAmIDto } from './dto/who-am-i.dto';
import { RegisterDetailsDto } from './dto/register-details.dto';

@Injectable()
export class AuthRepository extends Repository<User> {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {
    super(User, dataSource.createEntityManager());
  }

  async register(registerDto: RegisterDto): Promise<{
    user: User;
    accessToken: string;
    refreshToken: string;
    passcode: string;
  }> {
    const { email } = registerDto;

    const userExist: User = await this.findOne({ where: { email } });

    if (userExist) {
      throw new ConflictException('User already exist');
    }

    const passcode = randomInt(100000, 999999).toString();
    console.log('Passcode signup: ' + passcode);
    const hashedPasscode = await bcrypt.hash(passcode, 10);

    const user = new User();
    user.email = email;
    user.emailVerified = false;
    user.status = UserStatus.NEW_REGISTER;
    user.userType = UserType.USER;
    user.role = UserRole.HEAD;
    user.passcode = hashedPasscode;
    const savedUser = await this.save(user);

    const accessToken = await this.signJwtToken(savedUser.id, '1h');
    const refreshToken = await this.signJwtToken(savedUser.id, '30d');

    return { user, accessToken, refreshToken, passcode };
  }

  async registerDetails(
    registerDetailsDto: RegisterDetailsDto,
    user: User,
  ): Promise<MessageResponseDto> {
    Object.assign(user, registerDetailsDto);
    await this.save(user);
    return {
      message: 'User details are successfully saved.',
    };
  }

  async getUser(token: string): Promise<User> {
    return await this.verifyJwtToken(token);
  }

  async signIn(
    signInDto: SignInDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const { password, email } = signInDto;

    const user: User = await this.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('Please check your login credentials');
    }

    if (user.password === null) {
      throw new BadRequestException(
        'Password is not set up yet for this account.',
      );
    }
    console.log('PASSWORD: ' + password);
    console.log('USER PASSWORD: ' + user.password);
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new BadRequestException('Please check your login credentials');
    }

    const accessToken = await this.signJwtToken(user.id, '1h');
    const refreshToken = await this.signJwtToken(user.id, '30d');

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async passcodeVerification(
    passcodeDto: PasscodeDto,
    userId: string,
  ): Promise<MessageResponseDto> {
    const user = await this.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(
        'User is not found with provided register token',
      );
    }
    const { passcode } = passcodeDto;
    if (!user.passcode && user.emailVerified) {
      throw new BadRequestException('Your email is already verified');
    }
    const passcodeValid = await bcrypt.compare(passcode, user.passcode);
    if (!passcodeValid) {
      throw new BadRequestException('Passcode is not valid');
    }

    user.status = UserStatus.NO_PASSWORD;
    user.statusUpdatedAt = new Date();
    user.emailVerified = true;
    user.passcode = null;

    await this.save(user);

    return { message: 'Passcode verification successfully' };
  }

  async emailVerification(
    token: string,
  ): Promise<{ accessToken: string; refreshToken: string; user: User }> {
    const user = await this.verifyJwtToken(token);

    if (user.emailVerified == true) {
      throw new BadRequestException('User email is already verified.');
    }

    user.emailVerified = true;
    user.status = UserStatus.NO_PASSWORD;
    user.statusUpdatedAt = new Date();
    user.passcode = null;

    await this.save(user);

    const accessToken = await this.signJwtToken(user.id, '1h');
    const refreshToken = await this.signJwtToken(user.id, '30d');

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async setPassword(
    setPasswordDto: SetPasswordDto,
    user: User,
  ): Promise<MessageResponseDto> {
    const { password, repeatPassword } = setPasswordDto;

    if (user.password !== null) {
      throw new BadRequestException('Password is already set up');
    }

    if (password !== repeatPassword) {
      throw new BadRequestException('Password are not matching');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    user.status = UserStatus.ACTIVE;
    user.statusUpdatedAt = new Date();
    await this.save(user);
    return {
      message: 'Password is saved.',
    };
  }

  async forgotPasswordToken(forgotPasswordDto: ForgotPasswordDto): Promise<{
    forgotPasswordToken: string;
    user: User;
  }> {
    const { email } = forgotPasswordDto;
    let forgotPasswordToken;
    const user = await this.findOne({ where: { email } });

    if (!user) {
      forgotPasswordToken = null;
      return {
        forgotPasswordToken,
        user,
      };
    }

    forgotPasswordToken = await this.signJwtToken(user.id, '7d');
    return {
      forgotPasswordToken,
      user,
    };
  }

  async forgotPasswordVerification(token: string) {
    const user = await this.verifyJwtToken(token);

    user.password = null;
    user.status = UserStatus.NO_PASSWORD;
    user.statusUpdatedAt = new Date();
    await this.save(user);

    const accessToken = await this.signJwtToken(user.id, '1hr');
    const refreshToken = await this.signJwtToken(user.id, '30d');

    return { accessToken, refreshToken };
  }

  async signJwtToken(
    userId: string,
    expiresIn: string,
    companyId?: string,
  ): Promise<string> {
    try {
      const payload: {
        userId: string;
        companyId?: string;
      } = {
        userId,
      };

      if (companyId) {
        payload.companyId = companyId;
      }

      return this.jwtService.sign(payload, {
        secret: process.env.CLIENT_JWT_SECRET,
        expiresIn, // use this here, not in payload
      });
    } catch (error) {
      console.error('Error signing JWT token:', error);
      throw new InternalServerErrorException('Failed to generate token');
    }
  }


  async verifyJwtToken(token: string): Promise<User> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: process.env.CLIENT_JWT_SECRET,
      });

      if (!payload?.userId) {
        throw new UnauthorizedException('Invalid token payload: Missing user ID');
      }

      const user = await this.findOne({ where: { id: payload.userId } });

      if (!user) {
        throw new NotFoundException(
          'User with provided ID from token does not exist.',
        );
      }

      // Optionally attach companyId if needed
      if (payload.companyId && user.company?.id !== payload.companyId) {
        throw new UnauthorizedException('Invalid company ID in token');
      }

      return user;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token has expired');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid JWT token');
      }
      if (error.name === 'NotBeforeError') {
        throw new UnauthorizedException('Token is not yet active');
      }

      console.error('JWT Verification Error:', error);
      throw new UnauthorizedException('Could not verify token');
    }
  }

  async whoAmI(token: string): Promise<WhoAmIDto> {
    try {
      if (!token) {
        throw new HttpException('Token is missing', HttpStatus.BAD_REQUEST);
      }

      const payload: JwtPayload = await this.jwtService.verify(token, {
        secret: process.env.CLIENT_JWT_SECRET,
      });
      const userId = payload.userId;

      // Notice the addition of 'relations: ['company']'
      const user: User = await this.findOne({
        where: { id: userId },
        relations: ['company'],
      });

      if (!user) {
        throw new BadRequestException('Not found admin with provided admin id');
      }

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        emailVerified: user.emailVerified,
        phoneNumber: user.phoneNumber,
        role: user.role,
        status: user.status,
        refreshToken: user.refreshToken,
        companyId: user.company ? user.company.id : null,
      };
    } catch (error) {
      throw new UnauthorizedException(error);
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<{
    newAccessToken: string;
  }> {
    console.log('Starting refreshAccessToken method');

    if (!refreshToken) {
      console.error('No refresh token provided');
      throw new UnauthorizedException('No refresh token found');
    }

    try {
      console.log('Received refresh token:', refreshToken);

      // Verify the refresh token
      const payload: JwtPayload = await this.jwtService.verify(refreshToken, {
        secret: process.env.CLIENT_JWT_SECRET,
      });
      console.log('Refresh token verified successfully. Payload:', payload);

      const userId = payload.userId;
      console.log('Extracted adminId from payload:', userId);

      // Fetch admin profile
      const user = await this.findOne({ where: { id: userId } });

      if (!user) {
        console.error('Admin profile not found for id:', userId);
        throw new NotFoundException('Didnt find the user with that id');
      }

      // Create a new access token

      const payload2: JwtPayload = { userId };

      const newAccessToken = this.jwtService.sign(payload2, {
        secret: process.env.CLIENT_JWT_SECRET,
      });
      console.log('New access token created successfully:', newAccessToken);

      return { newAccessToken };
    } catch (error) {
      console.error('Error in refreshAccessToken:', error);
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
      throw new UnauthorizedException('Error processing refresh token');
    }
  }
}
