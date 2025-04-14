import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { User } from '../../entities/user.entity';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(
    req: Request & { user?: User; companyId?: string },
    res: Response,
    next: NextFunction,
  ) {
    const user = req.user;

    // If user is authenticated and has a company, attach it
    if (user && user.company?.id) {
      req.companyId = user.company.id;
    }

    if (user) {
      console.log('[TenantMiddleware] user:', user.id);
      console.log('[TenantMiddleware] company:', user.company?.id);
    }
    next();
  }
}
