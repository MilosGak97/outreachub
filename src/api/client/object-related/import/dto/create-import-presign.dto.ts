import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateImportPresignDto {
  @ApiProperty({ description: 'CSV filename' })
  @IsString()
  @Matches(/\.csv$/i, { message: 'Only .csv files are allowed' })
  filename: string;

  @ApiPropertyOptional({ description: 'Optional MIME type from the browser (defaults to text/csv)' })
  @IsOptional()
  @IsString()
  contentType?: string;
}
