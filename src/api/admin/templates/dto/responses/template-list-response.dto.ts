import { ApiProperty } from '@nestjs/swagger';
import { TemplateResponseDto } from './template-response.dto';

/**
 * Paginated response for listing CRM templates.
 *
 * Contains the templates array plus pagination metadata for building
 * table pagination UI components.
 *
 * @example
 * {
 *   "result": [
 *     {
 *       "id": "123e4567-e89b-12d3-a456-426614174000",
 *       "name": "Movers CRM",
 *       "slug": "movers_crm",
 *       "description": "Complete CRM for moving companies",
 *       "icon": "truck",
 *       "isActive": true,
 *       "displayOrder": 0,
 *       "modulesCount": 5,
 *       "companiesCount": 12,
 *       "createdAt": "2024-01-15T10:30:00.000Z",
 *       "updatedAt": "2024-03-22T14:45:00.000Z"
 *     }
 *   ],
 *   "totalRecords": 25,
 *   "currentPage": 1,
 *   "totalPages": 3,
 *   "limit": 10,
 *   "offset": 0
 * }
 */
export class TemplateListResponseDto {
  @ApiProperty({
    type: [TemplateResponseDto],
    description: `Array of template objects for the current page.

May be empty if no templates match the query filters or if offset exceeds total records.`,
  })
  result: TemplateResponseDto[];

  @ApiProperty({
    description: 'Total number of templates matching the query (ignoring pagination).',
    example: 25,
    minimum: 0,
  })
  totalRecords: number;

  @ApiProperty({
    description: `Current page number (1-based).

**Formula:** \`Math.floor(offset / limit) + 1\``,
    example: 1,
    minimum: 1,
  })
  currentPage: number;

  @ApiProperty({
    description: `Total number of pages available.

**Formula:** \`Math.ceil(totalRecords / limit)\`

Use this to disable "Next" when \`currentPage >= totalPages\`.`,
    example: 3,
    minimum: 1,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Number of items per page (same as the `limit` query parameter sent).',
    example: 10,
    minimum: 1,
  })
  limit: number;

  @ApiProperty({
    description: 'Number of items skipped (same as the `offset` query parameter sent).',
    example: 0,
    minimum: 0,
  })
  offset: number;
}
