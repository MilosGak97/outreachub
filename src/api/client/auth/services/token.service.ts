import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';
import { Token } from '../../../entities/token.entity';
import { TokenType } from '../../../enums/token/token-type.enum';
import { TokenStatus } from '../../../enums/token/token-status.enum';
import { AUTH_TOKEN_EXPIRY, AUTH_JWT_CONFIG } from '../constants/auth.constants';
import { JwtPayload } from '../strategies/jwt.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokenService {
  private readonly tokenRepo: Repository<Token>;
  private readonly jwtSecret: string;

  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {
    this.tokenRepo = dataSource.getRepository(Token);
    this.jwtSecret = configService.get<string>(AUTH_JWT_CONFIG.SECRET_ENV_KEY);
    if (!this.jwtSecret) {
      throw new Error(`${AUTH_JWT_CONFIG.SECRET_ENV_KEY} environment variable is required`);
    }
  }

  /**
   * Generate a JWT token
   */
  signToken(payload: JwtPayload, expiresIn: string): string {
    return jwt.sign(payload, this.jwtSecret, { expiresIn });
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch {
      return null;
    }
  }

  /**
   * Generate access and refresh token pair
   */
  generateTokenPair(userId: string, companyId?: string): TokenPair {
    const payload: JwtPayload = { userId };
    if (companyId) {
      payload.companyId = companyId;
    }

    return {
      accessToken: this.signToken(payload, AUTH_TOKEN_EXPIRY.ACCESS_TOKEN),
      refreshToken: this.signToken(payload, AUTH_TOKEN_EXPIRY.REFRESH_TOKEN),
    };
  }

  /**
   * Save tokens to database
   */
  async saveTokens(
    userId: string,
    tokens: TokenPair,
  ): Promise<{ accessTokenEntity: Token; refreshTokenEntity: Token }> {
    const now = new Date();

    const accessTokenEntity = this.tokenRepo.create({
      token: tokens.accessToken,
      type: TokenType.ACCESS,
      status: TokenStatus.ACTIVE,
      user: { id: userId },
      expiresAt: new Date(now.getTime() + AUTH_TOKEN_EXPIRY.ACCESS_TOKEN_MS),
    });

    const refreshTokenEntity = this.tokenRepo.create({
      token: tokens.refreshToken,
      type: TokenType.REFRESH,
      status: TokenStatus.ACTIVE,
      user: { id: userId },
      expiresAt: new Date(now.getTime() + AUTH_TOKEN_EXPIRY.REFRESH_TOKEN_MS),
    });

    await this.tokenRepo.save([accessTokenEntity, refreshTokenEntity]);

    return { accessTokenEntity, refreshTokenEntity };
  }

  /**
   * Validate a token from the database
   */
  async validateToken(token: string, type: TokenType): Promise<{ valid: boolean; userId?: string }> {
    const payload = this.verifyToken(token);
    if (!payload) {
      return { valid: false };
    }

    const tokenEntity = await this.tokenRepo.findOne({
      where: {
        token,
        type,
        status: TokenStatus.ACTIVE,
      },
    });

    if (!tokenEntity) {
      return { valid: false };
    }

    if (tokenEntity.expiresAt < new Date()) {
      await this.tokenRepo.update(tokenEntity.id, { status: TokenStatus.EXPIRED });
      return { valid: false };
    }

    return { valid: true, userId: payload.userId };
  }

  /**
   * Invalidate a specific token
   */
  async invalidateToken(token: string): Promise<void> {
    await this.tokenRepo.update({ token }, { status: TokenStatus.INACTIVE });
  }

  /**
   * Invalidate all tokens for a user
   */
  async invalidateAllUserTokens(userId: string, types?: TokenType[]): Promise<void> {
    const query: any = {
      user: { id: userId },
      status: TokenStatus.ACTIVE,
    };

    if (types && types.length > 0) {
      // TypeORM In operator would be needed here, using raw query for simplicity
      await this.tokenRepo
        .createQueryBuilder()
        .update(Token)
        .set({ status: TokenStatus.INACTIVE })
        .where('userId = :userId', { userId })
        .andWhere('status = :status', { status: TokenStatus.ACTIVE })
        .andWhere('type IN (:...types)', { types })
        .execute();
    } else {
      await this.tokenRepo.update(query, { status: TokenStatus.INACTIVE });
    }
  }

  /**
   * Refresh tokens - validates refresh token and generates new pair
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair | null> {
    const validation = await this.validateToken(refreshToken, TokenType.REFRESH);
    if (!validation.valid || !validation.userId) {
      return null;
    }

    // Invalidate old refresh token
    await this.invalidateToken(refreshToken);

    // Get user's company ID
    const userRepo = this.dataSource.getRepository('User');
    const user = await userRepo.findOne({
      where: { id: validation.userId },
      relations: ['company'],
    });

    // Generate new token pair
    const newTokens = this.generateTokenPair(validation.userId, user?.company?.id);
    await this.saveTokens(validation.userId, newTokens);

    return newTokens;
  }

}
