import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { WorkerRunItemDto } from './worker-run-item.dto';

export class WorkerRunListResponseDto {
  @ApiProperty({ type: [WorkerRunItemDto] })
  records: WorkerRunItemDto[];

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
