import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class GetBlueprintFieldsQueryDto {
  @ApiProperty({ required: true })
  @IsUUID()
  blueprintObjectId: string;
}
