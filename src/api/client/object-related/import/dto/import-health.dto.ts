import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportHealthDto {
  @ApiProperty()
  ok: boolean;

  @ApiPropertyOptional()
  error?: string;
}
