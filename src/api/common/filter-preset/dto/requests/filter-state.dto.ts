import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
} from '@nestjs/swagger';
import { Type, plainToInstance } from 'class-transformer';
import {
  IsDefined,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  validateSync,
} from 'class-validator';
import { DynamicFiltersDto } from './dynamic-filters.dto';
import { DynamicFilterItemDto } from './dynamic-filter-item.dto';
import { FilterStateMetaDto } from './filter-state-meta.dto';

@ValidatorConstraint({ name: 'DynamicFiltersValidator', async: false })
class DynamicFiltersValidator implements ValidatorConstraintInterface {
  validate(filters: unknown): boolean {
    if (!filters || typeof filters !== 'object') {
      return false;
    }

    const hasLogic = 'logic' in filters;
    const hasItems = 'items' in filters;

    if (!hasLogic && !hasItems) {
      return true;
    }

    if (!Array.isArray((filters as { items?: unknown }).items)) {
      return false;
    }

    const instance = plainToInstance(DynamicFiltersDto, filters);
    return validateSync(instance).length === 0;
  }

  defaultMessage(_args: ValidationArguments): string {
    return 'filters must be either a plain object or a valid dynamic filter structure';
  }
}

@ApiExtraModels(DynamicFiltersDto, DynamicFilterItemDto, FilterStateMetaDto)
export class FilterStateDto {
  @ApiProperty({
    description: 'Filter state schema version (currently fixed at 1)',
    example: 1,
  })
  @IsDefined()
  @IsInt()
  @IsIn([1])
  @Type(() => Number)
  version: number;

  @ApiPropertyOptional({
    description: 'Search text applied to the list',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  searchText?: string | null;

  @ApiProperty({
    description: 'Filter definitions payload',
    oneOf: [
      { type: 'object', additionalProperties: true },
      { $ref: getSchemaPath(DynamicFiltersDto) },
    ],
  })
  @IsDefined()
  @IsObject()
  @Validate(DynamicFiltersValidator)
  filters: Record<string, any> | DynamicFiltersDto;

  @ApiPropertyOptional({ type: () => FilterStateMetaDto })
  @IsOptional()
  @IsObject()
  @Type(() => FilterStateMetaDto)
  meta?: FilterStateMetaDto;
}
