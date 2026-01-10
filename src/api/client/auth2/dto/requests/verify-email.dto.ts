import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, ValidateIf } from 'class-validator';

export class VerifyEmailDto {
  @ApiPropertyOptional({ example: '123456', description: '6-digit verification passcode' })
  @ValidateIf((o) => !o.token)
  @IsString()
  @Length(6, 6)
  passcode?: string;

  @ApiPropertyOptional({ description: 'JWT verification token (from email link)' })
  @ValidateIf((o) => !o.passcode)
  @IsString()
  @IsOptional()
  token?: string;
}