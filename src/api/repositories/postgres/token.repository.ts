import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthRepository } from 'src/api/client/auth/auth.repository';
import { RegisterTokenResponseDto } from 'src/api/client/auth/dto/register-token-exist.dto';
import { Token } from 'src/api/entities/token.entity';
import { User } from 'src/api/entities/user.entity';
import { TokenStatus } from 'src/api/enums/token/token-status.enum';
import { TokenType } from 'src/api/enums/token/token-type.enum';
import { DataSource, In, Repository } from 'typeorm';

@Injectable()
export class TokenRepository extends Repository<Token> {
  constructor(
    private readonly clientAuthRepository: AuthRepository,
    private readonly dataSource: DataSource,
  ) {
    super(Token, dataSource.createEntityManager());
  }

  // return true if at least one register token is valid
  async registerTokenValidation(
    token: string,
  ): Promise<RegisterTokenResponseDto> {
    if (!token) {
      throw new BadRequestException('No token provided');
    }

    const tokenRecord = await this.findOne({ where: { token } });

    if (!tokenRecord.token) {
      throw new NotFoundException(
        'There is no token value under Token ID: ' + tokenRecord.id,
      );
    }
    if (tokenRecord.expiresAt < new Date()) {
      tokenRecord.status = TokenStatus.EXPIRED;
      await this.save(tokenRecord);
      throw new ConflictException('Token has been expired');
    }

    const user = await this.clientAuthRepository.verifyJwtToken(token);
    //console.log("PAYLOAD: " + JSON.stringify(payload, null, 2)); // Pretty print the object
    const userId = user.id;
    return {
      message: 'Register token exist',
      registerTokenExist: true,
      userId,
    };
  }

  async saveToken(
    user: User,
    registerToken: string,
    tokenType: TokenType,
    expireIn: string,
  ) {
    const tokenExist = await this.findOne({
      where: { user: { id: user.id }, token: registerToken },
    });
    if (tokenExist) {
      throw new ConflictException('Register token already exist');
    }

    const expireInSeconds = parseInt(expireIn, 10);
    const expires_at = new Date(Date.now() + expireInSeconds * 1000);

    const token = new Token();
    token.token = registerToken;
    token.user = user;
    token.expiresAt = expires_at;
    token.type = tokenType;
    token.status = TokenStatus.ACTIVE;
    await this.save(token);
  }

  async logoutTokens(userId: string): Promise<boolean> {
    await this.update(
      {
        status: TokenStatus.ACTIVE,
        type: In([TokenType.ACCESS, TokenType.REFRESH]),
        user: { id: userId },
      },
      { status: TokenStatus.INACTIVE },
    );

    return true;
  }

  async setInactive(token: string): Promise<boolean> {
    const tokenRecord = await this.findOne({ where: { token } });
    if (!tokenRecord) {
      throw new NotFoundException('Could not find requested token');
    }
    tokenRecord.status = TokenStatus.INACTIVE;
    await this.save(tokenRecord);
    return true;
  }

  async checkStatus(token: string): Promise<TokenStatus> {
    const tokenRecord = await this.findOne({ where: { token } });
    if (!tokenRecord) {
      throw new NotFoundException('Could not find requested token');
    }

    return tokenRecord.status;
  }
}
