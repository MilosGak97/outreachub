import { ApiProperty } from '@nestjs/swagger';
import { FilterStateDto } from '../requests/filter-state.dto';

export class FilterPresetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty({ type: () => FilterStateDto })
  filterState: FilterStateDto;

  @ApiProperty()
  conceptKey: string;

  @ApiProperty()
  tableId: string;

  @ApiProperty({ description: 'ISO 8601 timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'ISO 8601 timestamp' })
  updatedAt: string;
}
