import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TokenRepository } from 'src/api/repositories/postgres/token.repository';
import { TokenStatus } from 'src/api/enums/token/token-status.enum';
import { LessThan } from 'typeorm';

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly tokenRepository: TokenRepository) {}

  /**
   * Cleanup expired tokens from the database
   * Runs daily at 2:00 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTokens() {
    this.logger.log('Starting token cleanup job...');

    try {
      const now = new Date();

      // Find all expired tokens
      const result = await this.tokenRepository.update(
        {
          expiresAt: LessThan(now),
          status: TokenStatus.ACTIVE,
        },
        {
          status: TokenStatus.EXPIRED,
        },
      );

      this.logger.log(
        `Token cleanup completed. Marked ${result.affected || 0} tokens as expired.`,
      );

      // Optional: Delete tokens that have been expired for more than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deleteResult = await this.tokenRepository.delete({
        status: TokenStatus.EXPIRED,
        expiresAt: LessThan(thirtyDaysAgo),
      });

      this.logger.log(
        `Deleted ${deleteResult.affected || 0} expired tokens older than 30 days.`,
      );
    } catch (error) {
      this.logger.error('Error during token cleanup:', error);
    }
  }

  /**
   * Cleanup inactive tokens that are older than 7 days
   * Runs weekly on Sunday at 3:00 AM
   */
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupInactiveTokens() {
    this.logger.log('Starting inactive token cleanup job...');

    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const result = await this.tokenRepository.delete({
        status: TokenStatus.INACTIVE,
        updated_at: LessThan(sevenDaysAgo),
      });

      this.logger.log(
        `Deleted ${result.affected || 0} inactive tokens older than 7 days.`,
      );
    } catch (error) {
      this.logger.error('Error during inactive token cleanup:', error);
    }
  }
}
