import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

/**
 * DTO for uninstalling a module from a company.
 *
 * **Warning:** This operation can result in data loss. Objects, fields, and records
 * created by the module will be deleted.
 *
 * @example
 * // Attempt uninstall (will fail if data exists)
 * {
 *   "companyId": "123e4567-e89b-12d3-a456-426614174000",
 *   "moduleSlug": "advanced_reporting"
 * }
 *
 * @example
 * // Force uninstall with data deletion
 * {
 *   "companyId": "123e4567-e89b-12d3-a456-426614174000",
 *   "moduleSlug": "advanced_reporting",
 *   "force": true
 * }
 */
export class UninstallModuleDto {
  @ApiProperty({
    description: `UUID of the company to uninstall the module from.

The company must have this module currently installed.`,
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4')
  companyId: string;

  @ApiProperty({
    description: `Slug identifier of the module to uninstall.

**Restrictions:**
- Cannot uninstall \`core\` modules if other modules depend on them
- Cannot uninstall modules with protection level \`full\``,
    example: 'advanced_reporting',
  })
  @IsString()
  @IsNotEmpty()
  moduleSlug: string;

  @ApiPropertyOptional({
    description: `Force uninstall even when the module has associated data.

**Default behavior (force=false):**
- If records exist in objects created by this module, uninstall fails
- Returns an error listing affected objects and record counts

**With force=true:**
- All objects, fields, associations, and their data are permanently deleted
- This action is **irreversible**

**Use with caution!** Always back up data before force uninstalling.`,
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  force?: boolean;
}
