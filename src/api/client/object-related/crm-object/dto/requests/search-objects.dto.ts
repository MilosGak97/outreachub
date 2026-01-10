import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum FilterOperator {
  EQ = 'eq',
  NEQ = 'neq',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  CONTAINS = 'contains',
  STARTS_WITH = 'startsWith',
  ENDS_WITH = 'endsWith',
  IN = 'in',
  IS_NULL = 'isNull',
  IS_NOT_NULL = 'isNotNull',
}

export class FieldFilterDto {
  @ApiProperty({
    description: 'Field apiName to filter by',
    example: 'email',
  })
  @IsString()
  @IsNotEmpty()
  field: string;

  @ApiProperty({
    description: 'Filter operator',
    enum: FilterOperator,
    example: FilterOperator.CONTAINS,
  })
  @IsEnum(FilterOperator)
  operator: FilterOperator;

  @ApiPropertyOptional({
    description: 'Value to compare against (not needed for isNull/isNotNull)',
    example: '@example.com',
  })
  @IsOptional()
  value?: any;
}

export class SearchObjectsDto {
  @ApiProperty({
    description: 'Object type ID to search within',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  objectTypeId: string;

  @ApiPropertyOptional({
    description: 'Array of field filters',
    type: [FieldFilterDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FieldFilterDto)
  @IsOptional()
  filters?: FieldFilterDto[];

  @ApiPropertyOptional({
    description: 'Logic to apply between filters',
    enum: ['AND', 'OR'],
    default: 'AND',
  })
  @IsEnum(['AND', 'OR'])
  @IsOptional()
  filterLogic?: 'AND' | 'OR' = 'AND';

  @ApiProperty({
    description: 'Number of records to return',
    example: 20,
    default: 20,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number = 20;

  @ApiProperty({
    description: 'Number of records to skip',
    example: 0,
    default: 0,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number = 0;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'displayName',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'sortBy can only contain letters, numbers, and underscores',
  })
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsEnum(['ASC', 'DESC'])
  @IsOptional()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
