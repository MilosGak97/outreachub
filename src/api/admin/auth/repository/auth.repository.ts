import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { AdminStatus } from 'src/api/enums/admin/admin-status.enum';
import { DataSource, Repository } from 'typeorm';
import { SignInDto } from '../dto/sign-in-admin.dto';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from '../dto/jwt-payload.interface';
import { PasswordResetDto } from '../dto/password-reset.dto';
import { Admin } from 'src/api/entities/admin.entity';
import { MessageResponseDto } from 'src/api/responses/message-response.dto';
import { WhoAmIDto } from '../dto/who-am-i.dto';
import { PhoneNumberUtil } from '../../../common/phone/phone-number.util';

@Injectable()
export class AuthRepository extends Repository<Admin> {
  private readonly logger = new Logger(AuthRepository.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly phoneNumberUtil: PhoneNumberUtil,
  ) {
    super(Admin, dataSource.createEntityManager());
  }

  // new method
  async verifyEmail(token: string): Promise<{
    refreshToken: string;
    accessToken: string;
  }> {
    // Verify the token and extract the payload
    const payload = await this.jwtService.verify(token, {
      secret: process.env.ADMIN_JWT_SECRET,
    });

    // Find the user based on the userId from the payload
    const user = await this.findOne({ where: { id: payload.userId } });

    // Sign new access and refresh tokens without the exp property
    const accessToken = await this.jwtService.sign(payload, {
      secret: process.env.ADMIN_JWT_SECRET,
    });
    const refreshToken = await this.jwtService.sign(payload, {
      secret: process.env.ADMIN_JWT_SECRET,
    });

    // If user is not found, throw an error
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user's email verification status and set them to active
    user.emailVerified = true;
    user.status = AdminStatus.ACTIVE;
    await this.save(user);

    // Return the new tokens
    return {
      refreshToken,
      accessToken,
    };
  }

  // new method
  async signIn(signInAdminDto: SignInDto): Promise<{
    refreshToken: string;
    accessToken: string;
  }> {
    const { email, password } = signInAdminDto;
    this.logger.log(`Attempting to sign in admin with email: ${email}`);

    const user = await this.findOne({ where: { email } });

    if (!user) {
      this.logger.warn(`Sign-in failed: No user found with email: ${email}`);
      throw new UnauthorizedException('Check your credentials');
    }

    this.logger.log(`User found with ID: ${user.id}. Verifying password...`);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const adminId = user.id;
      const payload: JwtPayload = { adminId };

      const accessToken = this.jwtService.sign(payload, {
        secret: process.env.ADMIN_JWT_SECRET,
      });
      const refreshToken = this.jwtService.sign(payload, {
        expiresIn: '7d',
        secret: process.env.ADMIN_JWT_SECRET,
      });

      user.refreshToken = refreshToken; // Save the refresh token as needed
      await this.save(user); // Ensure save operation is awaited

      this.logger.log(
        `JWT token generated successfully for user ID: ${adminId}`,
      );
      this.logger.log(`Sign-in successful for user ID: ${adminId}`);
      return { accessToken, refreshToken };
    } else {
      this.logger.warn(`Sign-in failed: Invalid password for email: ${email}`);
      throw new UnauthorizedException('Please check your login credentials');
    }
  }

  // new method
  async logout(token: string): Promise<boolean> {
    try {
      const payload: JwtPayload = await this.jwtService.verify(token, {
        secret: process.env.ADMIN_JWT_SECRET,
      });
      const adminId = payload.adminId;

      const adminUser = await this.findOne({ where: { id: adminId } });
      if (!adminUser) {
        throw new NotFoundException('Admin user with this id doesnt exist');
      }

      adminUser.refreshToken = '';
      await this.save(adminUser);
      return true;
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  // new method
  async passwordReset(
    passwordResetDto: PasswordResetDto,
    admin: Admin,
  ): Promise<MessageResponseDto> {
    const { oldPassword, newPassword, newPasswordRepeat } = passwordResetDto;

    const user = await this.findOne({ where: { id: admin.id } });

    if (!user) {
      throw new NotFoundException('User with that id is not found');
    }

    if (oldPassword) {
      const passwordMatched = await bcrypt.compare(oldPassword, user.password);

      if (!passwordMatched) {
        throw new BadRequestException('Old password is incorect');
      }
    }

    if (newPassword !== newPasswordRepeat) {
      throw new BadRequestException('New Passwords are not matching');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    if (user.initialPassword) {
      user.initialPassword = false;
    }

    user.emailVerified = true;

    await this.save(user);

    return {
      message: 'Password is successfully updated',
    };
  }

  // new method
  async whoAmI(token: string): Promise<WhoAmIDto> {
    try {
      console.log('token in rep: ', token)
      if (!token) {
        throw new HttpException('Token is missing', HttpStatus.BAD_REQUEST);
      }

      const payload: JwtPayload = await this.jwtService.verify(token, {
        secret: process.env.ADMIN_JWT_SECRET,
      });


      const adminId = payload.adminId;
      const admin = await this.findOne({ where: { id: adminId } });
      if (!admin) {
        throw new NotFoundException('Not found admin with provided admin id');
      }

      return {  id:               admin.id,                        // required
        name:             admin.name         ?? null,     // string or null
        email:            admin.email        ?? null,     // string or null
        emailVerified:    admin.emailVerified ?? false,   // boolean default false
        phoneNumber:      admin.phoneNumber   ?? null,     // string or null
        phoneNumberPrefix:  admin.phoneCountryCode
          ? this.phoneNumberUtil.getByCode(admin.phoneCountryCode)
          : null,
        role:             admin.role         ?? null,     // enum or null
        status:           admin.status       ?? null,     // enum or null
        refreshToken:     admin.refreshToken ?? null,     // string or null
        initialPassword:  admin.initialPassword ?? null,  // string or null
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
        secret: process.env.ADMIN_JWT_SECRET,
      });
      console.log('Refresh token verified successfully. Payload:', payload);

      const adminId = payload.adminId;
      console.log('Extracted adminId from payload:', adminId);

      // Fetch admin profile
      const adminProfile = await this.findOne({ where: { id: adminId } });


      if (!adminProfile) {
        console.error('Admin profile not found for id:', adminId);
        throw new NotFoundException('Didnt find the user with that id');
      }

      // Create a new access token

      const payload2: JwtPayload = { adminId };

      const newAccessToken = this.jwtService.sign(payload2, {
        secret: process.env.ADMIN_JWT_SECRET,
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
