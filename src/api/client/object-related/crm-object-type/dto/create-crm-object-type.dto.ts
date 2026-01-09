import { IsNotEmpty, IsString, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCrmObjectTypeDto {
  @ApiProperty({required:true})
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({required:true})
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/)
  apiName: string;

  @ApiProperty({required:false})
  @IsOptional()
  @IsString()
  description?: string;
}
