import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { CrmObjectListItemDto } from './crm-object-list-item.dto';

@ApiExtraModels(CrmObjectListItemDto)
export class CrmObjectListResponseDto {
  @ApiProperty({ type: [CrmObjectListItemDto] })
  result: CrmObjectListItemDto[];

  @ApiProperty({
    description: 'Total number of records matching the query',
    example: 100,
  })
  @IsNumber()
  @Type(() => Number)
  totalRecords: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  @IsNumber()
  @Type(() => Number)
  currentPage: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 5,
  })
  @IsNumber()
  @Type(() => Number)
  totalPages: number;

  @ApiProperty({
    description: 'Number of records per page',
    example: 20,
  })
  @IsNumber()
  @Type(() => Number)
  limit: number;

  @ApiProperty({
    description: 'Number of records skipped',
    example: 0,
  })
  @IsNumber()
  @Type(() => Number)
  offset: number;
}