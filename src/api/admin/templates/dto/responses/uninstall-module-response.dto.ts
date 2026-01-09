import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';

/**
 * Response DTO returned after successfully uninstalling a module.
 *
 * @example
 * {
 *   "message": "Module 'advanced_reporting' uninstalled successfully",
 *   "deletedCount": 156
 * }
 */
export class UninstallModuleResponseDto {
  @ApiProperty({
    description: `Human-readable success message.

Can be displayed directly to users in a toast notification.

**Format:** \`"Module '{moduleSlug}' uninstalled successfully"\``,
    example: "Module 'advanced_reporting' uninstalled successfully",
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: `Total count of deleted records across all affected tables.

This includes:
- Object type definitions
- Field definitions
- Association type definitions
- Actual data records (if \`force: true\` was used)`,
    example: 156,
    minimum: 0,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  deletedCount: number;
}
