import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO for creating a new CRM template.
 *
 * @example
 * {
 *   "name": "Movers CRM",
 *   "slug": "movers_crm",
 *   "description": "Complete CRM for moving companies",
 *   "icon": "truck",
 *   "isActive": true,
 *   "displayOrder": 0
 * }
 */
export class CreateTemplateDto {
  @ApiProperty({
    description: 'Display name of the template shown in UI',
    example: 'Movers CRM',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    description: `Unique identifier for the template. Used in URLs and API calls.

**Rules:**
- Lowercase letters, numbers, underscores, and hyphens only
- Cannot be changed after creation
- Must be unique across all templates

**Examples:** \`movers_crm\`, \`realtors-pro\`, \`logistics_2024\``,
    example: 'movers_crm',
    pattern: '^[a-z0-9_-]+$',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  @Matches(/^[a-z0-9_-]+$/, {
    message: 'slug must contain only lowercase letters, numbers, underscores, and hyphens',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'Detailed description of what this template provides. Shown to admins when selecting templates.',
    example: 'Complete CRM solution for moving companies. Includes lead tracking, job management, crew scheduling, and customer relationship tools.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Icon identifier or emoji for visual representation in UI',
    example: 'truck',
    maxLength: 255,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @ApiPropertyOptional({
    description: `Whether this template is available for companies to install.

- \`true\`: Template appears in template selection and can be installed
- \`false\`: Template is hidden (draft mode) and cannot be installed`,
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Sort order when displaying templates. Lower numbers appear first.',
    example: 0,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  displayOrder?: number;
}
