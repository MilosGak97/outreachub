import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Type } from 'class-transformer';
import { Property } from './property.entity';

@Entity('property-base-enrichment')
export class PropertyBaseEnrichment {
  @ApiProperty({required: true})
  @IsNotEmpty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Property, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'property_id' })
  property: Property;

  // attribution_info.agent_name
  @ApiProperty({required: false})
  @IsOptional()
  @Column({name: 'realtor_name', nullable: true})
  realtorName?: string; // listing_provided_by.name

  // attribution_info.agent_phone_number
  @ApiProperty({required: false})
  @IsOptional()
  @Column({name: 'realtor_phone', nullable: true})
  realtorPhone?: string; // listing_provided_by.name


  // attribution_info.broker_name
  @ApiProperty({ required: false })
  @IsOptional()
  @Column({ name: 'broker_name', nullable: true })
  brokerName?: string;

  // attribution_info.broker_phone_number
  @ApiProperty({required: false})
  @Type(() => String)
  @IsOptional()
  @Column({name: 'brokerage_phone', nullable: true})
  brokeragePhone?: string;


  @ApiProperty({ required: false })
  @IsOptional()
  @Column({ name: 'parcel_id', nullable: true })
  parcelId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Column({ name: 'mosaic_s3_key', nullable: true })
  mosaicS3Key?: string;

  @ApiProperty({required: false})
  @IsOptional()
  @Column({name: 'county_zillow', nullable: true})
  countyZillow?: string;


  // photo_count
  @ApiProperty({required: false})
  @Type((): NumberConstructor => Number)
  @IsOptional()
  @Column({name: 'photo_count', nullable: true})
  photoCount?: number; // photoCount

  // original_photos.[0-foreach].mixed_sources.jpeg.[0-static].url
  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @Column({ type: 'text', array: true, nullable: true })
  photos?: string[];



  @ApiProperty({required: false})
  @CreateDateColumn({name: 'created_at'})
  createdAt?: Date;

  @ApiProperty({required: false})
  @UpdateDateColumn({name: 'updated_at'})
  updatedAt?: Date;
}
