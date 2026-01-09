import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

/**
 * DTO for installing an additional module to a company that already has a template.
 *
 * Use this to add optional modules after the initial template installation.
 * The company must already have the parent template installed.
 *
 * @example
 * {
 *   "companyId": "123e4567-e89b-12d3-a456-426614174000",
 *   "moduleSlug": "advanced_reporting"
 * }
 */
export class InstallModuleDto {
  @ApiProperty({
    description: `UUID of the company to install the module to.

**Requirements:**
- Company must exist
- Company must already have the parent template installed
- Module must not already be installed for this company`,
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4')
  companyId: string;

  @ApiProperty({
    description: `Slug identifier of the module to install.

Must be a valid module slug from the company's installed template.

**Common module slugs:**
- \`core\` - Base functionality (usually auto-installed)
- \`inventory\` - Inventory tracking
- \`scheduling\` - Appointment/job scheduling
- \`reporting\` - Reports and analytics
- \`advanced_reporting\` - Advanced analytics add-on`,
    example: 'advanced_reporting',
  })
  @IsString()
  @IsNotEmpty()
  moduleSlug: string;
}
