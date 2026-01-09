import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class CreateImportSessionDto {
  @ApiProperty()
  @IsUUID()
  @IsString()
  fileId: string;
}
