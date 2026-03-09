import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Controller
import { AuthController } from './auth.controller';

// Services
import { AuthService } from './services/auth.service';
import { TokenService } from './services/token.service';

// Strategy
import { JwtStrategy } from './strategies/jwt.strategy';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';
import { CompanyRequiredGuard } from './guards/company-required.guard';
import { EmailVerifiedGuard } from './guards/email-verified.guard';

// Entities
import { User } from '../../entities/user.entity';
import { Token } from '../../entities/token.entity';
import { Company } from '../../entities/company.entity';

// Email Service
import { EmailService } from '../../email/email.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([User, Token, Company]),
  ],
  controllers: [AuthController],
  providers: [
    // Services
    AuthService,
    TokenService,
    EmailService,

    // Strategy
    JwtStrategy,

    // Guards (exported for use in other modules)
    AuthGuard,
    OptionalAuthGuard,
    CompanyRequiredGuard,
    EmailVerifiedGuard,
  ],
  exports: [
    // Export for use in other modules
    AuthService,
    TokenService,
    JwtStrategy,
    PassportModule,
    AuthGuard,
    OptionalAuthGuard,
    CompanyRequiredGuard,
    EmailVerifiedGuard,
  ],
})
export class AuthModule {}
