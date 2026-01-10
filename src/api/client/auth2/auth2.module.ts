import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Controller
import { Auth2Controller } from './auth2.controller';

// Services
import { Auth2Service } from './services/auth2.service';
import { Token2Service } from './services/token2.service';
import { InviteService } from './services/invite.service';

// Strategy
import { Jwt2Strategy } from './strategies/jwt2.strategy';

// Guards
import { Auth2Guard } from './guards/auth2.guard';
import { OptionalAuth2Guard } from './guards/optional-auth2.guard';
import { CompanyRequiredGuard } from './guards/company-required.guard';
import { EmailVerifiedGuard } from './guards/email-verified.guard';

// Entities
import { User } from '../../entities/user.entity';
import { Token } from '../../entities/token.entity';
import { Company } from '../../entities/company.entity';
import { Invite } from '../../entities/auth/invite.entity';

// Email Service
import { EmailService } from '../../email/email.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt2' }),
    TypeOrmModule.forFeature([User, Token, Company, Invite]),
  ],
  controllers: [Auth2Controller],
  providers: [
    // Services
    Auth2Service,
    Token2Service,
    InviteService,
    EmailService,

    // Strategy
    Jwt2Strategy,

    // Guards (exported for use in other modules)
    Auth2Guard,
    OptionalAuth2Guard,
    CompanyRequiredGuard,
    EmailVerifiedGuard,
  ],
  exports: [
    // Export for use in other modules
    Auth2Service,
    Token2Service,
    InviteService,
    Jwt2Strategy,
    PassportModule,
    Auth2Guard,
    OptionalAuth2Guard,
    CompanyRequiredGuard,
    EmailVerifiedGuard,
  ],
})
export class Auth2Module {}
