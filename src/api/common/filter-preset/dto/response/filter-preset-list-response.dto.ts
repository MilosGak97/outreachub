import { ApiProperty } from '@nestjs/swagger';
import { FilterPresetResponseDto } from './filter-preset-response.dto';
import { FilterPresetListContextDto } from './filter-preset-list-context.dto';

export class FilterPresetListResponseDto {
  @ApiProperty({ type: () => FilterPresetListContextDto })
  context: FilterPresetListContextDto;

  @ApiProperty({ type: [FilterPresetResponseDto] })
  items: FilterPresetResponseDto[];

  @ApiProperty({ example: 50 })
  limit: number;
}
