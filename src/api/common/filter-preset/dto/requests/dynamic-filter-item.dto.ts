import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DynamicFilterItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  fieldId: string;

  @ApiProperty({ description: 'Operator: eq, in, contains, etc.' })
  @IsString()
  @IsNotEmpty()
  op: string;

  @ApiProperty({
    description: 'Value for operator',
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  value: any;
}
