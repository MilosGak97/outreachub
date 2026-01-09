import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum, IsNotEmpty,
  IsOptional,
  IsString, Length,
} from 'class-validator';
import { AdminRole } from 'src/api/enums/admin/admin-role.enum';
export class UpdateAdminDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
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

  @ApiProperty({
    enum: AdminRole, // Enum for available roles
    enumName: 'AdminRole',
    required: false,
  })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}
