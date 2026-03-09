import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FilterStateDto } from './filter-state.dto';

export class UpdateFilterPresetDto {
  @ApiPropertyOptional({ description: 'Preset name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ description: 'Set preset as default' })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ type: () => FilterStateDto })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => FilterStateDto)
  filterState?: FilterStateDto;
}
