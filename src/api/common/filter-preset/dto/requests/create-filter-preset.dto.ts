import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateFilterPresetDto {
  @ApiProperty({ description: 'Stable identifier for the list concept' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  conceptKey: string;

  @ApiProperty({ description: 'Stable identifier for the table instance' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  tableId: string;

  @ApiProperty({ description: 'Preset name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ description: 'Set preset as default', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiProperty({ type: () => FilterStateDto })
  @IsObject()
  @ValidateNested()
  @Type(() => FilterStateDto)
  filterState: FilterStateDto;
}
