import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User } from '../../../entities/user.entity';

/**
 * Guard that ensures the authenticated user has verified their email.
 * Should be used AFTER Auth2Guard.
 */
@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException('Email verification required. Please verify your email first.');
    }

    return true;
  }
}