import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export enum Industry {
  MOVERS = 'movers',
  REALTORS = 'realtors',
  WHOLESALERS = 'wholesalers',
}

export class SetupCompanyDto {
  @ApiProperty({ example: 'Acme Moving Co.', description: 'Company name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'https://acmemoving.com', description: 'Company website URL' })
  @IsUrl()
  @IsNotEmpty()
  website: string;

  @ApiPropertyOptional({ enum: Industry, default: Industry.MOVERS, description: 'Industry type (determines which template modules are installed)' })
  @IsOptional()
  @IsEnum(Industry)
  industry?: Industry;
}