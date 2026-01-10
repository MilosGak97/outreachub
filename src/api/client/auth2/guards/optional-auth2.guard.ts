import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';

/**
 * Optional authentication guard.
 * Returns null user instead of throwing 401 if not authenticated.
 * Useful for endpoints like /me that need to return different responses
 * based on authentication status.
 */
@Injectable()
export class OptionalAuth2Guard extends AuthGuard('jwt2') {
  constructor(private readonly cls: ClsService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const result = await super.canActivate(context);

      if (result) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (user?.company?.id) {
          this.cls.set('companyId', user.company.id);
        }
      }

      return true;
    } catch {
      // Authentication failed - set user to null and continue
      const request = context.switchToHttp().getRequest();
      request.user = null;
      return true;
    }
  }

  handleRequest(err: any, user: any) {
    // Don't throw on error, just return null
    if (err || !user) {
      return null;
    }
    return user;
  }
}