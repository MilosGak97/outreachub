import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

/**
 * Response DTO returned after installing a template or module.
 *
 * Contains detailed statistics about what was created and any errors encountered.
 *
 * @example
 * // Successful installation
 * {
 *   "success": true,
 *   "templateSlug": "movers_crm",
 *   "installedModules": ["core", "inventory", "scheduling"],
 *   "createdObjectTypes": 8,
 *   "createdFields": 45,
 *   "createdAssociations": 12
 * }
 *
 * @example
 * // Partial success with errors
 * {
 *   "success": true,
 *   "templateSlug": "movers_crm",
 *   "installedModules": ["core", "inventory"],
 *   "createdObjectTypes": 5,
 *   "createdFields": 28,
 *   "createdAssociations": 6,
 *   "errors": [
 *     "Module 'invalid_module' not found in template",
 *     "Failed to create association: source object not found"
 *   ]
 * }
 */
export class InstallationResultDto {
  @ApiProperty({
    description: `Overall installation success status.

- \`true\`: Installation completed (may have partial errors)
- \`false\`: Installation failed completely

**Note:** Can be \`true\` even with errors if some modules installed successfully.`,
    example: true,
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    description: 'Slug of the template that was installed.',
    example: 'movers_crm',
  })
  @IsString()
  templateSlug: string;

  @ApiProperty({
    description: `Array of module slugs that were successfully installed.

**Example:** \`["core", "inventory", "scheduling"]\`

Empty array if no modules were installed.`,
    type: [String],
    example: ['core', 'inventory', 'scheduling'],
  })
  @IsArray()
  @IsString({ each: true })
  installedModules: string[];

  @ApiProperty({
    description: `Total number of CRM object types created.

Object types are the "tables" in your CRM (e.g., Contact, Lead, Job, Invoice).`,
    example: 8,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  createdObjectTypes: number;

  @ApiProperty({
    description: `Total number of fields created across all object types.

Fields define the properties of objects (e.g., email, phone, status dropdown).

Includes all field types: text, number, email, phone, select, multi-select, etc.`,
    example: 45,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  createdFields: number;

  @ApiProperty({
    description: `Total number of associations (relationships) created between object types.

Associations define how objects relate to each other (e.g., Contact → Jobs, Lead → Quotes).`,
    example: 12,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  createdAssociations: number;

  @ApiPropertyOptional({
    description: `Array of error messages encountered during installation.

**Common errors:**
- \`"Module 'xxx' not found in template"\` - Invalid module slug
- \`"Object type 'xxx' already exists"\` - Naming conflict
- \`"Failed to create association: source object not found"\` - Dependency issue`,
    type: [String],
    example: ['Module "invalid_module" not found in template'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  errors?: string[];
}
