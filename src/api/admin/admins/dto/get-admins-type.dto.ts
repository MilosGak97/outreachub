
import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { AdminRole } from '../../../enums/admin/admin-role.enum';
import { AdminStatus } from '../../../enums/admin/admin-status.enum';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PhoneNumberTypeDto } from '../../../common/phone/dto/phone-number-type.dto';
@ApiExtraModels(PhoneNumberTypeDto)
export class GetAdminsTypeDto {
  @ApiProperty()
  @IsString()
  @Type(() => String)
  id: string;

  @ApiProperty()
  @IsString()
  @Type(() => String)
  name: string;

  @ApiProperty()
  @IsString()
  @Type(() => String)
  email: string;

  @ApiProperty({ enum: AdminRole, enumName: 'AdminRole' })
  @IsEnum(AdminRole)
  role: AdminRole;

  @ApiProperty({ enum: AdminStatus, enumName: 'AdminStatus' })
  @IsEnum(AdminStatus)
  status: AdminStatus;

  @ApiProperty()
  phoneNumber: string

  @ApiProperty()
  @IsOptional()
  phonePrefix?: PhoneNumberTypeDto | null
}
