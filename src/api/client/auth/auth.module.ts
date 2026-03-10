import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

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

// Repositories
import { UserRepository } from '../../repositories/postgres/users.repository';
import { CompanyRepository } from '../../repositories/postgres/company.repository';

// Email Service
import { EmailService } from '../../email/email.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}), // Required to satisfy UserRepository's JwtService dependency
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    EmailService,
    JwtStrategy,
    AuthGuard,
    OptionalAuthGuard,
    CompanyRequiredGuard,
    EmailVerifiedGuard,
    UserRepository,
    CompanyRepository,
  ],
  exports: [
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
