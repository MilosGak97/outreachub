import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber } from 'class-validator';

export class ImportRowsParseResponseDto {
  @ApiProperty()
  @IsNumber()
  rowCount: number;

  @ApiProperty()
  @IsBoolean()
  hasHeader: boolean;
}
