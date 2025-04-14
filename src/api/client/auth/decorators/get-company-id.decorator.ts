// src/api/decorators/get-company-id.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetCompanyId = createParamDecorator(
  (data: undefined, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user?.company?.id;
  },
);
