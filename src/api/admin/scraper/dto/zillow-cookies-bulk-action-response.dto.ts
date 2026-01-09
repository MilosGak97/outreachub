import { ApiProperty } from '@nestjs/swagger';

export class ZillowCookiesBulkActionResponseDto {
  @ApiProperty({ type: [String] })
  processedIds: string[];

  @ApiProperty({ type: [String] })
  skippedIds: string[];
}
