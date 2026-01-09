import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ObjectTypeDto{
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  id:string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  name: string;


  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  apiName: string;


  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  description: string;



}