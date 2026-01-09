import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetBlueprintAssociationsQueryDto {
  @ApiProperty({ required: true })
  @IsUUID()
  moduleId: string;
}
