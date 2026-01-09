import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for updating an existing CRM template.
 *
 * All fields are optional - only include fields you want to change.
 * The `slug` cannot be changed after creation (not included in this DTO).
 *
 * @example
 * // Update just the name
 * { "name": "Moving Company CRM Pro" }
 *
 * @example
 * // Deactivate a template
 * { "isActive": false }
 *
 * @example
 * // Full update
 * {
 *   "name": "Movers CRM Pro",
 *   "description": "Enhanced CRM for moving companies with advanced features",
 *   "icon": "truck-fast",
 *   "isActive": true,
 *   "displayOrder": 1
 * }
 */
export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: 'New display name for the template. Leave empty to keep current name.',
    example: 'Movers CRM Pro',
    minLength: 1,
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  name?: string;

  @ApiPropertyOptional({
    description: `Updated description explaining what this template provides.

Supports multi-line text. Use this to help admins understand when to use this template.`,
    example: 'Enhanced CRM for moving companies. Now includes inventory tracking, damage reporting, and customer satisfaction surveys.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated icon identifier or emoji for the template',
    example: 'truck-fast',
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @ApiPropertyOptional({
    description: `Toggle template visibility and availability.

- \`true\`: Template is active and can be installed by companies
- \`false\`: Template is hidden (useful for drafts or deprecated templates)

**Warning:** Deactivating a template does NOT uninstall it from companies that already have it installed.`,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: `Change the sort order when displaying templates in selection UI.

Lower numbers appear first. Templates with the same displayOrder are sorted by name.`,
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
