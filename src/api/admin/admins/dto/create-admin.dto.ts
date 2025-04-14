// src/admin_users/dto/create-admin-user.dto.ts
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  Length,
  IsNumberString, ValidateNested,
} from 'class-validator';
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '../../../enums/admin-role.enum';
import { Column } from 'typeorm';
import { PhoneNumberTypeDto } from '../../../common/dto/phone-number-type.dto';
import { Type } from 'class-transformer';

@ApiExtraModels(PhoneNumberTypeDto)
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

// Remove separate phoneCountryCode and phoneNumberPrefix if you want everything inside phoneObject.
  // If you need to keep them, they can still be used as underlying values.
  // For now, we include only the nested phoneObject property.
  @ApiProperty({ required: false, type: PhoneNumberTypeDto, nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type((): typeof PhoneNumberTypeDto => PhoneNumberTypeDto)
  phoneNumber?: PhoneNumberTypeDto;

  @ApiProperty({
    enum: AdminRole, // Enum for available roles
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(AdminRole)
  role: AdminRole;
}
