import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ZillowCookieItemDto } from './zillow-cookie-item.dto';

@ApiExtraModels(ZillowCookieItemDto)
export class ZillowCookiesListResponseDto {
  @ApiProperty({ type: [ZillowCookieItemDto] })
  result: ZillowCookieItemDto[];

  @ApiProperty()
  @Type(() => Number)
  totalRecords: number;

  @ApiProperty()
  @Type(() => Number)
  currentPage: number;

  @ApiProperty()
  @Type(() => Number)
  totalPages: number;

  @ApiProperty()
  @Type(() => Number)
  limit: number;

  @ApiProperty()
  @Type(() => Number)
  offset: number;
}
