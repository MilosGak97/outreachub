import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class ImportPresignResponseDto {
  @ApiProperty()
  @IsString()
  uploadUrl: string;

  @ApiProperty()
  @IsString()
  storageKey: string;

  @ApiProperty()
  @IsString()
  bucket: string;

  @ApiProperty()
  @IsString()
  contentType: string;

  @ApiProperty()
  @IsNumber()
  expiresIn: number;
}
