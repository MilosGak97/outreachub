import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { ImportRowResultDto } from './import-row-result.dto';

export class ImportRowResultListResponseDto {
  @ApiProperty({ type: [ImportRowResultDto] })
  result: ImportRowResultDto[];

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  totalRecords: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  offset: number;
}
