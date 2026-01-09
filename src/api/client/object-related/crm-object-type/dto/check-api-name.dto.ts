import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCrmObjectTypeDto {
  @ApiProperty({required:true})
  @IsNotEmpty()
  @IsString()
  name: string;

}
