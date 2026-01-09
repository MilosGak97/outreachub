import { ApiProperty } from '@nestjs/swagger';

export class WorkerRunBulkActionResponseDto {
  @ApiProperty({ type: [String] })
  processedIds: string[];

  @ApiProperty({ type: [String] })
  skippedIds: string[];
}
