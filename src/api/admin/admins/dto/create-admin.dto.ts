// src/admin_users/dto/create-admin-user.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsEnum,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '../../../enums/admin/admin-role.enum';

export class CreateAdminDto {
  @ApiProperty({
    required: true, // Indicates this field is required
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({required: true})
  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  phoneCountryCode: string;

  @ApiProperty({required: true})
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    enum: AdminRole, // Enum for available roles
    enumName: 'AdminRole',
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(AdminRole)
  role: AdminRole;
}
