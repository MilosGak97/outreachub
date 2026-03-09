import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com', description: 'Email address to send reset link' })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;
}