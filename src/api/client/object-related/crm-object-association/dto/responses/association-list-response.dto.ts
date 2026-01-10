import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { CrmObjectAssociationResponseDto } from './association-response.dto';

@ApiExtraModels(CrmObjectAssociationResponseDto)
export class AssociationListResponseDto {
  @ApiProperty({ type: [CrmObjectAssociationResponseDto] })
  result: CrmObjectAssociationResponseDto[];

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Type(() => Number)
  totalRecords: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  currentPage: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Type(() => Number)
  totalPages: number;

  @ApiProperty({ example: 20 })
  @IsNumber()
  @Type(() => Number)
  limit: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @Type(() => Number)
  offset: number;
}
