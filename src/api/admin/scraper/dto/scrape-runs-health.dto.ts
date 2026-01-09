import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScrapeRunsHealthDto {
  @ApiPropertyOptional()
  region?: string;

  @ApiProperty()
  table: string;

  @ApiProperty()
  tableReachable: boolean;

  @ApiPropertyOptional()
  error?: string;
}

