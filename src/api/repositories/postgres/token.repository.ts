import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Token } from 'src/api/entities/token.entity';
import { User } from 'src/api/entities/user.entity';
import { TokenStatus } from 'src/api/enums/token/token-status.enum';
import { TokenType } from 'src/api/enums/token/token-type.enum';
import { DataSource, In, Repository } from 'typeorm';

@Injectable()
export class TokenRepository extends Repository<Token> {
  constructor(
    private readonly dataSource: DataSource,
  ) {
    super(Token, dataSource.createEntityManager());
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
