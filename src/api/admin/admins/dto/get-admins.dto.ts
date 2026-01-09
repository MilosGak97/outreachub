import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { AdminRole } from '../../../enums/admin/admin-role.enum';
import { Transform, Type } from 'class-transformer';
import { AdminStatus } from '../../../enums/admin/admin-status.enum';

const toArray = (value: unknown): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  const rawValues = Array.isArray(value) ? value : [value];
  const flattened: string[] = [];
  for (const raw of rawValues) {
    if (raw === undefined || raw === null) continue;
    if (Array.isArray(raw)) {
      flattened.push(...raw.map((v) => v.toString()));
      continue;
    }
    const asString = raw.toString();
    if (asString.includes(',')) {
      flattened.push(...asString.split(',').map((part) => part.trim()).filter(Boolean));
    } else if (asString.trim()) {
      flattened.push(asString.trim());
    }
  }
  return flattened.length > 0 ? flattened : undefined;
};


export class GetAdminsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  searchQuery?: string;

  @ApiProperty({
    enum: AdminRole,
    enumName: 'AdminRole',
    isArray: true,
    required: false,
  })
  @Transform(({ value }) => toArray(value), { toClassOnly: true })
  @IsOptional()
  @IsArray()
  role?: AdminRole[];

  @ApiProperty({
    isArray: true,
    required: false,
    enum: AdminStatus,
    enumName: 'AdminStatus',
  })
  @Transform(({ value }) => toArray(value), { toClassOnly: true })
  @IsOptional()
  @IsArray()
  status?: AdminStatus[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  initialPassword?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  limit: number;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  offset: number;
}
