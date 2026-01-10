import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { DataSource } from 'typeorm';
import { User } from '../../../entities/user.entity';
import { UserStatus } from '../../../enums/user/user-status.enum';
import { AUTH2_COOKIE_NAMES, AUTH2_JWT_CONFIG } from '../constants/auth2.constants';

export interface JwtPayload {
  userId: string;
  companyId?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class Jwt2Strategy extends PassportStrategy(Strategy, 'jwt2') {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {
    const secret = configService.get<string>(AUTH2_JWT_CONFIG.SECRET_ENV_KEY);
    if (!secret) {
      throw new Error(`${AUTH2_JWT_CONFIG.SECRET_ENV_KEY} environment variable is required`);
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.[AUTH2_COOKIE_NAMES.ACCESS_TOKEN] ?? null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    if (!payload?.userId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const userRepo = this.dataSource.getRepository(User);
    const user = await userRepo.findOne({
      where: { id: payload.userId },
      relations: ['company'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Check user status - allow PENDING_VERIFICATION and ACTIVE
    const allowedStatuses = [UserStatus.PENDING_VERIFICATION, UserStatus.ACTIVE];
    if (!allowedStatuses.includes(user.status)) {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify company ID matches if present in token
    if (payload.companyId && user.company?.id !== payload.companyId) {
      throw new UnauthorizedException('Company mismatch');
    }

    return user;
  }
}