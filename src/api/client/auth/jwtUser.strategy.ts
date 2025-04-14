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
    const { userId } = payload;

    const user: User = await this.authRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('Could not find the user with provided ID');
    }
    return user;
  }
}
