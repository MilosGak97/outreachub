// src/api/decorators/get-company.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Company } from 'src/api/entities/company.entity';

export const GetCompany = createParamDecorator(
  (data: undefined, ctx: ExecutionContext): Company | undefined => {
    const req = ctx.switchToHttp().getRequest();
    return req.user?.company;
  },
);
