import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetBlueprintObjectsQueryDto {
  @ApiProperty({ required: true })
  @IsUUID()
  moduleId: string;
}
