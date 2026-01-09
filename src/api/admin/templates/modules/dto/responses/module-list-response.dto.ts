import { ApiProperty } from '@nestjs/swagger';
import { ModuleResponseDto } from './module-response.dto';

export class ModuleListResponseDto {
  @ApiProperty({ type: [ModuleResponseDto] })
  result: ModuleResponseDto[];

  @ApiProperty()
  totalRecords: number;

  @ApiProperty()
  currentPage: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}
