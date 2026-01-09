import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class PhoneNumberTypeDto {
  @ApiProperty({required: true})
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({required: true})
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({required: true})
  @IsNotEmpty()
  @IsString()
  flag: string;

  @ApiProperty({required: true})
  @IsNotEmpty()
  @IsString()
  prefix: string;
 }