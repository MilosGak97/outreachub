import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RegisterCompanyDto{
  @ApiProperty({ required: true })
  @IsString()
  name: string;

  @ApiProperty({ required: true })
  @IsString()
  website: string;

}