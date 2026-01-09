import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CountiesResponseDto {
  @ApiProperty({
    description: 'Counties formatted like "Cook County, IL"',
    isArray: true,
    required: true,
    type: String,
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  result: string[];

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  totalRecords: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  currentPage: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  totalPages: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  limit: number;

  @ApiProperty()
  @IsNumber()
  @Type(() => Number)
  offset: number;
}
