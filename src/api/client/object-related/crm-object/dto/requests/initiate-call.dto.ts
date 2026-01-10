import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty } from 'class-validator';

export class InitiateCallDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  protectedValueId: string;

  @ApiProperty({ description: 'E.164 number that should initiate the call', example: '+13015551234' })
  @IsString()
  @IsNotEmpty()
  fromNumber: string;
}
