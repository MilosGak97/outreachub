import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class Auth2Guard extends AuthGuard('jwt2') {
  constructor(private readonly cls: ClsService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const result = await super.canActivate(context);

    if (result) {
      const request = context.switchToHttp().getRequest();
      const user = request.user;

      // Set company ID in CLS for multi-tenant queries
      if (user?.company?.id) {
        this.cls.set('companyId', user.company.id);
      }
    }

    return result as boolean;
  }
}
