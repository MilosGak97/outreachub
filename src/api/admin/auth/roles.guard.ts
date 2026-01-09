import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core'; 
import { AdminRole } from '../../enums/admin/admin-role.enum';
import { Admin } from 'src/api/entities/admin.entity';
import { UserType } from 'src/api/enums/user/user-type.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // Get the required roles from metadata (can be set on controller or method)
        const roles = this.reflector.getAllAndOverride<AdminRole[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!roles || roles.length === 0) {
            return true; // No roles specified, allow access by default
        }

        const request = context.switchToHttp().getRequest();
        const user: Admin = request.user; // Get the user from request

        if (!user) {
            throw new UnauthorizedException('User not authenticated');
        }

        if(user.userType !== UserType.EMPLOYEE){
            throw new ForbiddenException("User type is not " + UserType.EMPLOYEE)
        }


        // Check if the user has at least one of the required roles
        const hasRole = roles.some((role) => user.role === role);

        if (!hasRole) {
            throw new ForbiddenException('You do not have access to this resource');
        }

        // Check if the user still has the initial password set
        if (user.initialPassword) {
            throw new UnauthorizedException('Initial password is true. Please change your password.');
        }

        return true; // User has one of the necessary roles
    }
}
