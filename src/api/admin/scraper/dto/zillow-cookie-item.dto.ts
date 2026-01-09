import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ZillowCookieItemDto {
  @ApiProperty()
  cookieId: string;

  @ApiProperty()
  value: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  @Type(() => Number)
  successCount: number;

  @ApiProperty()
  @Type(() => Number)
  failCount: number;

  @ApiProperty({ required: false })
  lastUsedAt?: string;
}
