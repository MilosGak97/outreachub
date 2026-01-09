import { ApiProperty } from '@nestjs/swagger';
import { WorkerRunItemDto } from './worker-run-item.dto';

export class WorkerRunBulkCreateResponseDto {
  @ApiProperty({ type: [WorkerRunItemDto] })
  created: WorkerRunItemDto[];

  @ApiProperty({ type: [String] })
  skippedStates: string[];
}
