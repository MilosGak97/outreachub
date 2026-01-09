import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID } from 'class-validator';
import { ImportSessionStatus } from '../../../../enums/import/import-session-status.enum';

export class ImportSessionDto {
  @ApiProperty()
  @IsUUID()
  @IsString()
  id: string;

  @ApiProperty()
  @IsUUID()
  @IsString()
  fileId: string;

  @ApiProperty({ enum: ImportSessionStatus, enumName: 'ImportSessionStatus' })
  @IsEnum(ImportSessionStatus)
  status: ImportSessionStatus;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
