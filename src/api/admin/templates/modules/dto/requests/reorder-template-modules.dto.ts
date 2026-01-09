import { ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsOptional, IsUUID } from 'class-validator';

export class ReorderTemplateModulesDto {
  @ApiPropertyOptional({
    description: 'Desired module order (UUID list)',
    type: [String],
    example: ['module-id-1', 'module-id-2', 'module-id-3'],
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', { each: true })
  orderedIds?: string[];
}
