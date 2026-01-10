import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty, MaxLength } from 'class-validator';

export class SendSmsDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  protectedValueId: string;

  @ApiProperty({ maxLength: 1600 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1600)
  message: string;

  @ApiProperty({ description: 'E.164 number that should send the SMS', example: '+13015551234' })
  @IsString()
  @IsNotEmpty()
  fromNumber: string;
}
