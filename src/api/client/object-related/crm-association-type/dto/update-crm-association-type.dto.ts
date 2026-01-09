import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
export class UpdateCrmAssociationTypeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Type((): BooleanConstructor => Boolean)
  isBidirectional?: boolean;

  @ApiPropertyOptional({
    description:
      'Label for the reverse direction (target -> source). Required when setting isBidirectional=true.',
  })
  @ValidateIf(
    (o: UpdateCrmAssociationTypeDto): boolean => o.isBidirectional === true,
  )
  @IsOptional()
  @IsString()
  reverseName?: string;

}
