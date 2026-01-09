import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from "@nestjs/passport";
import { ClsService } from 'nestjs-cls';

@Injectable()
export class UserAuthGuard extends AuthGuard('user-jwt'){
  constructor(private readonly cls: ClsService) {
    super();
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Set companyId into CLS after user is attached
    if (user?.company?.id) {
      this.cls.set('companyId', user.company.id);
      console.log('[UserAuthGuard] Set companyId in CLS:', user.company.id);
    }

    // Default behavior: return the user or throw error
    return super.handleRequest(err, user, info, context);
  }
}