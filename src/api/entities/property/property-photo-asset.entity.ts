import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Property } from './property.entity';
import { PropertyPhotoAssetStatus } from '../../enums/property/property-photo-asset-status.enum';

@Entity('property-photo-assets')
@Index('idx_property_photo_assets_property', ['property'])
@Index('idx_property_photo_assets_status', ['status'])
@Index('uniq_property_photo_assets_source', ['property', 'sourceUrl'], { unique: true })
export class PropertyPhotoAsset {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Property })
  @ManyToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  @ApiProperty()
  @IsString()
  @Column({ name: 'source_url' })
  sourceUrl: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Column({ name: 'thumb_s3_key', nullable: true })
  thumbS3Key?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Column({ name: 'normal_s3_key', nullable: true })
  normalS3Key?: string;

  @ApiProperty({ enum: PropertyPhotoAssetStatus, enumName: 'PropertyPhotoAssetStatus' })
  @IsEnum(PropertyPhotoAssetStatus)
  @Column({
    type: 'enum',
    enum: PropertyPhotoAssetStatus,
    default: PropertyPhotoAssetStatus.PENDING,
  })
  status: PropertyPhotoAssetStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @Column({ name: 'last_error', type: 'text', nullable: true })
  lastError?: string;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
