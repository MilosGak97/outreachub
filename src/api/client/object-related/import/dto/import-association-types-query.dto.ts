import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class ImportAssociationTypesQueryDto {
  @ApiProperty()
  @IsUUID('4')
  @IsString()
  sourceObjectTypeId: string;

  @ApiProperty()
  @IsUUID('4')
  @IsString()
  targetObjectTypeId: string;
}
