import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum, IsNotEmpty,
  IsOptional,
  IsString, Length,
} from 'class-validator';
import { UserRole } from 'src/api/enums/user/user-role.enum';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  email?: string;


  @ApiProperty({required: false})
  @IsOptional()
  @IsString()
  @Length(2, 2)
  phoneCountryCode?: string;

  @ApiProperty({required: false})
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({ required: false, enum: UserRole, enumName: 'UserRole' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
