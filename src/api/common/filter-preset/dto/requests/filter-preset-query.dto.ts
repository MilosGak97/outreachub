import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class FilterPresetQueryDto {
  @ApiProperty({ description: 'Stable identifier for the list concept' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  conceptKey: string;

  @ApiProperty({ description: 'Stable identifier for the table instance' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  tableId: string;
}
