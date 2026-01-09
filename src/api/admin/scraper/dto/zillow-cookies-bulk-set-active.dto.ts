import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsString } from 'class-validator';

export class ZillowCookiesBulkSetActiveDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  cookieIds: string[];

  @ApiProperty()
  @IsBoolean()
  isActive: boolean;
}
