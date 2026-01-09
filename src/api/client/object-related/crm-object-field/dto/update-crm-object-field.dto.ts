import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateCrmObjectFieldDto {
  @ApiPropertyOptional({ example: 'Full Name', description: 'New display name of the field' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Primary contact display name', description: 'Optional helper text for the field' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: true, description: 'Toggle field required status' })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;
}
