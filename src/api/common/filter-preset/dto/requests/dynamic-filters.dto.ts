import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsString, ValidateNested } from 'class-validator';
import { DynamicFilterItemDto } from './dynamic-filter-item.dto';

export class DynamicFiltersDto {
  @ApiProperty({ enum: ['AND', 'OR'], example: 'AND' })
  @IsString()
  @IsIn(['AND', 'OR'])
  logic: 'AND' | 'OR';

  @ApiProperty({ type: [DynamicFilterItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DynamicFilterItemDto)
  items: DynamicFilterItemDto[];
}
