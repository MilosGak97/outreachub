import { ApiProperty } from '@nestjs/swagger';

/**
 * Response DTO representing a CRM template.
 *
 * Templates are pre-built CRM configurations that can be installed to companies.
 * Each template contains modules with object types, fields, and associations.
 *
 * @example
 * {
 *   "id": "123e4567-e89b-12d3-a456-426614174000",
 *   "name": "Movers CRM",
 *   "slug": "movers_crm",
 *   "description": "Complete CRM for moving companies",
 *   "icon": "truck",
 *   "isActive": true,
 *   "displayOrder": 0,
 *   "modulesCount": 5,
 *   "companiesCount": 12,
 *   "createdAt": "2024-01-15T10:30:00.000Z",
 *   "updatedAt": "2024-03-22T14:45:00.000Z"
 * }
 */
export class TemplateResponseDto {
  @ApiProperty({
    description: 'Unique UUID identifier for the template.',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  id: string;

  @ApiProperty({
    description: 'Display name shown in the UI when selecting or viewing templates.',
    example: 'Movers CRM',
  })
  name: string;

  @ApiProperty({
    description: `Unique slug identifier used in URLs and API calls.

**Characteristics:**
- Lowercase letters, numbers, underscores, and hyphens only
- Cannot be changed after creation
- Used as the \`templateSlug\` parameter in installation endpoints`,
    example: 'movers_crm',
  })
  slug: string;

  @ApiProperty({
    description: 'Detailed description explaining what this template provides and who it\'s for.',
    nullable: true,
    example: 'Complete CRM solution for moving companies. Includes lead tracking, job management, crew scheduling, and customer relationship tools.',
  })
  description: string | null;

  @ApiProperty({
    description: 'Icon identifier (e.g., icon library name) or emoji for visual representation.',
    nullable: true,
    example: 'truck',
  })
  icon: string | null;

  @ApiProperty({
    description: `Whether the template is available for companies to install.

- \`true\`: Active and visible in template selection
- \`false\`: Hidden (draft or deprecated)`,
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Sort order when displaying templates. Lower numbers appear first.',
    example: 0,
    minimum: 0,
  })
  displayOrder: number;

  @ApiProperty({
    description: `Number of modules contained in this template.

Modules are logical groupings of objects, fields, and associations (e.g., "Inventory", "Scheduling", "Reporting").`,
    example: 5,
    minimum: 0,
  })
  modulesCount: number;

  @ApiProperty({
    description: `Number of companies currently using this template.

**Note:** This count includes all companies that have installed any modules from this template.`,
    example: 12,
    minimum: 0,
  })
  companiesCount: number;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the template was created.',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the template was last updated.',
    example: '2024-03-22T14:45:00.000Z',
    format: 'date-time',
  })
  updatedAt: Date;
}
