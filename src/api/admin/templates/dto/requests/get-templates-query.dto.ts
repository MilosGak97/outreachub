import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Query parameters for fetching a paginated list of templates.
 *
 * @example
 * // Basic pagination - first page, 10 items
 * GET /templates?limit=10&offset=0
 *
 * @example
 * // Search for templates with pagination
 * GET /templates?limit=20&offset=0&searchQuery=movers
 *
 * @example
 * // Get only active templates
 * GET /templates?limit=10&offset=0&isActive=true
 */
export class GetTemplatesQueryDto {
  @ApiProperty({
    description: `Maximum number of templates to return per page.

**Recommended values:**
- \`10\` for dropdown/select components
- \`20-25\` for table views
- \`50\` for bulk operations`,
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit: number;

  @ApiProperty({
    description: `Number of templates to skip before returning results.

**Pagination formula:**
- Page 1: offset = 0
- Page 2: offset = limit
- Page N: offset = (N - 1) * limit

**Example:** To get page 3 with 10 items per page: \`offset=20, limit=10\``,
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset: number;

  @ApiPropertyOptional({
    description: `Search term to filter templates by name, slug, or description.

Search is case-insensitive and matches partial text.

**Examples:**
- \`"movers"\` matches "Movers CRM", "movers_pro"
- \`"real"\` matches "Realtors CRM", "Real Estate Pro"`,
    example: 'movers',
  })
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @ApiPropertyOptional({
    description: `Filter by active status.

- \`true\`: Only show active templates (available for installation)
- \`false\`: Only show inactive templates (drafts or deprecated)
- Omit: Show all templates regardless of status`,
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  isActive?: boolean;
}
