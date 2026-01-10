import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class BulkDeleteObjectsDto {
  @ApiProperty({
    description: 'Array of object IDs to delete (max 100)',
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '660e8400-e29b-41d4-a716-446655440001',
    ],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMaxSize(100, { message: 'Maximum 100 objects per bulk delete' })
  ids: string[];
}