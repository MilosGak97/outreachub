import { ApiPropertyOptional } from '@nestjs/swagger';

export class FormulaCategoryToFunctionsDto {
  @ApiPropertyOptional({ type: [String] })
  math?: string[];

  @ApiPropertyOptional({ type: [String] })
  string?: string[];

  @ApiPropertyOptional({ type: [String] })
  date?: string[];
}
