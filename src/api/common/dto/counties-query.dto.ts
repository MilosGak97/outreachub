import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { State } from '../../enums/property/state.enum';

export class CountiesQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for county name, case insensitive and supports partial matches',
    example: 'cook co',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by state abbreviation',
    enum: State,
  })
  @IsOptional()
  @IsEnum(State)
  state?: State;

  @ApiPropertyOptional({
    description: 'Number of records to return (defaults to 20)',
    example: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of records to skip (defaults to 0)',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}
