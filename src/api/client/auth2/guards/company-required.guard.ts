import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { User } from '../../../entities/user.entity';

/**
 * Guard that ensures the authenticated user has a company.
 * Should be used AFTER Auth2Guard.
 */
@Injectable()
export class CompanyRequiredGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (!user.company) {
      throw new ForbiddenException('Company setup required. Please create or join a company first.');
    }

    return true;
  }
}