import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, MaxLength } from 'class-validator';
import { UserRole } from '../../../../enums/user/user-role.enum';

export class CreateInviteDto {
  @ApiProperty({ example: 'newemployee@example.com', description: 'Email of the person to invite' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.SALES, description: 'Role to assign to the invited user' })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
}