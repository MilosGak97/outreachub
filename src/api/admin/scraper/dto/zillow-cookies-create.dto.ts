import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class ZillowCookiesCreateDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  values: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
