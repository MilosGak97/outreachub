import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../../entities/user.entity';

/**
 * Parameter decorator to extract the current user from the request.
 * Works with Auth2Guard which attaches the user to request.user
 */
export const CurrentUser2 = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext): User | any => {
    const request = ctx.switchToHttp().getRequest();
    const user: User = request.user;

    // If a specific property is requested, return just that property
    if (data && user) {
      return user[data];
    }

    return user;
  },
);
