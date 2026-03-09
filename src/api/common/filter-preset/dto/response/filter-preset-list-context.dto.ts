import { ApiProperty } from '@nestjs/swagger';

export class FilterPresetListContextDto {
  @ApiProperty()
  conceptKey: string;

  @ApiProperty()
  tableId: string;
}
