import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsNotEmpty, MaxLength } from 'class-validator';

export class SendEmailDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @IsUUID()
  protectedValueId: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({ description: 'Sender email address', example: 'noreply@example.com' })
  @IsString()
  @IsNotEmpty()
  fromAddress: string;
}
