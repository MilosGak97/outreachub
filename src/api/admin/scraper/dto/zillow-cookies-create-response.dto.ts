import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ZillowCookieItemDto } from './zillow-cookie-item.dto';

export class ZillowCookiesCreateResponseDto {
  @ApiProperty({ type: [ZillowCookieItemDto] })
  result: ZillowCookieItemDto[];

  @ApiProperty()
  @Type(() => Number)
  totalCreated: number;
}
