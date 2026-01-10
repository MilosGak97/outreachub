import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsOptional, IsUUID } from 'class-validator';

export class CreateCrmObjectAssociationDto {
  @ApiProperty({
    description: 'ID of the association type',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @IsNotEmpty()
  typeId: string;

  @ApiProperty({
    description: 'ID of the source object',
    example: '660e8400-e29b-41d4-a716-446655440001',
  })
  @IsUUID()
  @IsNotEmpty()
  sourceObjectId: string;

  @ApiProperty({
    description: 'ID of the target object',
    example: '770e8400-e29b-41d4-a716-446655440002',
  })
  @IsUUID()
  @IsNotEmpty()
  targetObjectId: string;

  @ApiPropertyOptional({
    description: 'Optional metadata for this association',
    example: { notes: 'Primary contact' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
