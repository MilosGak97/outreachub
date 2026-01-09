import { Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy } from "passport-jwt"; 
import { JwtPayload } from "./dto/jwt-payload.interface"; 
import { AuthRepository } from "./repository/auth.repository"; 
import { Admin } from "src/api/entities/admin.entity";
import { UserType } from "src/api/enums/user/user-type.enum";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'admin-jwt'){
    
    private readonly logger = new Logger(AuthRepository.name);

    constructor(private authRepository: AuthRepository) {
        super({
            secretOrKey:  process.env.ADMIN_JWT_SECRET,
            jwtFromRequest: (req) => {
                return req.cookies['accessToken']; // Extract from cookies
            },
        });
    }

 

    async validate(payload: JwtPayload): Promise<Admin> {
        const { adminId } = payload; 

        const user: Admin = await this.authRepository.findOne({ where: { id: adminId , userType: UserType.EMPLOYEE} });

        if (!user) {
            this.logger.warn(`Unauthorized access attempt for userId: ${adminId}`);
            throw new UnauthorizedException();
        }
        return user;
    }

}