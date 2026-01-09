import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Embedded template info for installation response.
 * Simplified version without circular references.
 */
class InstalledTemplateDto {
  @ApiProperty({
    description: 'UUID of the template',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Display name of the template',
    example: 'Movers CRM',
  })
  name: string;

  @ApiProperty({
    description: 'Unique slug identifier',
    example: 'movers_crm',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Template description',
    example: 'Complete CRM for moving companies',
    nullable: true,
  })
  description: string | null;

  @ApiPropertyOptional({
    description: 'Icon identifier',
    example: 'truck',
    nullable: true,
  })
  icon: string | null;
}

/**
 * Embedded module info for installation response.
 * Simplified version without circular references.
 */
class InstalledModuleDto {
  @ApiProperty({
    description: 'UUID of the module',
    example: '987fcdeb-51a2-3d4e-b678-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Display name of the module',
    example: 'Inventory Management',
  })
  name: string;

  @ApiProperty({
    description: 'Unique slug identifier within the template',
    example: 'inventory',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Module description',
    example: 'Track inventory items, boxes, and equipment',
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Whether this is a required core module',
    example: false,
  })
  isCore: boolean;

  @ApiProperty({
    description: 'Sort order for display',
    example: 2,
  })
  displayOrder: number;
}

/**
 * Response DTO for getting a company's template installation status.
 *
 * Returns the template (if any) and all installed modules for a company.
 *
 * @example
 * // Company with template installed
 * {
 *   "template": {
 *     "id": "123e4567-e89b-12d3-a456-426614174000",
 *     "name": "Movers CRM",
 *     "slug": "movers_crm",
 *     "description": "Complete CRM for moving companies",
 *     "icon": "truck"
 *   },
 *   "modules": [
 *     {
 *       "id": "987fcdeb-51a2-3d4e-b678-426614174000",
 *       "name": "Core",
 *       "slug": "core",
 *       "description": "Base CRM functionality",
 *       "isCore": true,
 *       "displayOrder": 0
 *     },
 *     {
 *       "id": "abc12345-6789-0def-ghij-426614174000",
 *       "name": "Inventory Management",
 *       "slug": "inventory",
 *       "description": "Track inventory items and equipment",
 *       "isCore": false,
 *       "displayOrder": 1
 *     }
 *   ]
 * }
 *
 * @example
 * // Company without template
 * {
 *   "template": null,
 *   "modules": []
 * }
 */
export class CompanyTemplateInstallationResponseDto {
  @ApiPropertyOptional({
    description: 'The template installed for this company, or `null` if no template is installed.',
    type: InstalledTemplateDto,
    nullable: true,
  })
  template: InstalledTemplateDto | null;

  @ApiProperty({
    description: `Array of modules installed for this company.

Empty array if no template is installed or no modules have been installed yet.

Modules are sorted by \`displayOrder\` (core modules first, then optional modules).`,
    type: [InstalledModuleDto],
    example: [
      {
        id: '987fcdeb-51a2-3d4e-b678-426614174000',
        name: 'Core',
        slug: 'core',
        description: 'Base CRM functionality',
        isCore: true,
        displayOrder: 0,
      },
      {
        id: 'abc12345-6789-0def-ghij-426614174000',
        name: 'Inventory Management',
        slug: 'inventory',
        description: 'Track inventory items and equipment',
        isCore: false,
        displayOrder: 1,
      },
    ],
  })
  modules: InstalledModuleDto[];
}
