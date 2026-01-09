import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

/**
 * DTO for installing a template to a company.
 *
 * Templates contain multiple modules. You can choose to install:
 * 1. Specific modules by listing their slugs
 * 2. All modules at once using the `installAllModules` flag
 *
 * @example
 * // Install specific modules
 * {
 *   "companyId": "123e4567-e89b-12d3-a456-426614174000",
 *   "templateSlug": "movers_crm",
 *   "modules": ["core", "inventory", "scheduling"]
 * }
 *
 * @example
 * // Install all modules
 * {
 *   "companyId": "123e4567-e89b-12d3-a456-426614174000",
 *   "templateSlug": "movers_crm",
 *   "installAllModules": true
 * }
 */
export class InstallTemplateDto {
  @ApiProperty({
    description: `UUID of the company to install the template to.

The company must exist and not already have this template installed.`,
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID('4')
  companyId: string;

  @ApiProperty({
    description: `Slug identifier of the template to install.

Must match an existing active template's slug (e.g., "movers_crm", "realtors-pro").`,
    example: 'movers_crm',
  })
  @IsString()
  @IsNotEmpty()
  templateSlug: string;

  @ApiPropertyOptional({
    description: `Array of module slugs to install.

**Behavior:**
- Only the specified modules will be installed
- Order doesn't matter - modules are installed based on their dependencies
- Invalid module slugs will be reported in the response errors array
- If both \`modules\` and \`installAllModules\` are provided, \`installAllModules\` takes precedence

**Note:** Core modules required by other modules will be installed automatically.`,
    type: [String],
    example: ['core', 'inventory', 'scheduling'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  modules?: string[];

  @ApiPropertyOptional({
    description: `Set to \`true\` to install ALL modules in the template.

**Use this when:**
- Setting up a new company with full functionality
- You want all features the template provides

**Effect:** Overrides the \`modules\` array if both are provided.`,
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  installAllModules?: boolean;
}
