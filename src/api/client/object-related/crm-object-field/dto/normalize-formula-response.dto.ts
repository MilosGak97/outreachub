import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FormulaNormalizedConfigDto } from './formula-normalized-config.dto';

export class NormalizeFormulaResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty({ type: [String] })
  errors: string[];

  @ApiPropertyOptional({ type: FormulaNormalizedConfigDto })
  normalized?: FormulaNormalizedConfigDto;
}

