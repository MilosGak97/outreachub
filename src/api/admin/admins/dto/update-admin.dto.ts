import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { AdminRole } from 'src/api/enums/admin-role.enum';
import { PhoneNumberTypeDto } from '../../../common/dto/phone-number-type.dto';

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


  @ApiProperty({ required: false })
  @IsOptional()
  phoneNumber?: PhoneNumberTypeDto;

  @ApiProperty({
    enum: AdminRole, // Enum for available roles
    required: false,
  })
  @IsOptional()
  @IsEnum(AdminRole)
  role?: AdminRole;
}
