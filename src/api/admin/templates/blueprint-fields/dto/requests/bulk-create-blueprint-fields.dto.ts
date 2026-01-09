import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsUUID, ValidateNested } from 'class-validator';
import { CreateBlueprintFieldDto } from './create-blueprint-field.dto';

export class BulkCreateBlueprintFieldsDto {
  @ApiProperty()
  @IsUUID()
  blueprintObjectId: string;

  @ApiProperty({ type: [CreateBlueprintFieldDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBlueprintFieldDto)
  fields: CreateBlueprintFieldDto[];
}
