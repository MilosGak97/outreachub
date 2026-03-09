import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterStateMetaDto {
  @ApiPropertyOptional({ description: 'Origin of the preset state' })
  @IsOptional()
  @IsString()
  createdFrom?: string;
}
