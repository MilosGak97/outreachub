import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';
import { AssociationTypeDto } from './association-type.dto';

@ApiExtraModels(AssociationTypeDto)
export class GetAllAssociationTypesResponseDto {
  @ApiProperty({ type: [AssociationTypeDto] })
  result: AssociationTypeDto[];

  @ApiProperty()
  @IsNumber()
  @Type((): NumberConstructor => Number)
  totalRecords: number;

  @ApiProperty()
  @IsNumber()
  @Type((): NumberConstructor => Number)
  currentPage: number;

  @ApiProperty()
  @IsNumber()
  @Type((): NumberConstructor => Number)
  totalPages: number;

  @ApiProperty()
  @IsNumber()
  @Type((): NumberConstructor => Number)
  limit: number;

  @ApiProperty()
  @IsNumber()
  @Type((): NumberConstructor => Number)
  offset: number;
}

