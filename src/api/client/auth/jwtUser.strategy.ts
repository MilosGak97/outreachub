import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { AuthRepository } from './auth.repository';
import { JwtPayload } from './dto/jwt-payload.interface';
import { User } from 'src/api/entities/user.entity';

@Injectable()
export class JwtUserStrategy extends PassportStrategy(Strategy, 'user-jwt') {
  constructor(private readonly authRepository: AuthRepository) {
    super({
      secretOrKey: process.env.CLIENT_JWT_SECRET,
      jwtFromRequest: (req) => {
        return req.cookies['accessToken'];
      },
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { userId, companyId } = payload;
    // const { userId, companyId } = payload;  // Assuming the JWT has companyId


    const user: User = await this.authRepository.findOne({
      where: { id: userId },
      relations: ['company'], // <- this is crucial
    });
    if (!user) {
      throw new BadRequestException('Could not find the user with provided ID');
    }

    // CRITICAL, MUST BE ADDED.
    // we have to get it in jwtPayload
    // and to include it in Sign tokens
/*
    if (!payload || !payload.exp || Date.now() >= payload.exp * 1000) {
      throw new BadRequestException('JWT is expired');
    }
*/
    // Optionally handle companyId absence (e.g., user has not created a company yet)
    if (companyId && user.company?.id !== companyId) {
        throw new BadRequestException('Invalid company for the user');
    }

      return user;
  }
}
