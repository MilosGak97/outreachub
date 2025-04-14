import { createParamDecorator, ExecutionContext } from "@nestjs/common";  
import { User } from "src/api/entities/user.entity";

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest();
    return req.user; // Extracting the admin from req.user
  }
);
