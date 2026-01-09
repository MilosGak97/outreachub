
import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn, OneToMany, OneToOne, Index,
} from 'typeorm';
import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {Type} from 'class-transformer';
import {IsBoolean, IsEnum, IsNumberString, IsOptional} from 'class-validator';
import { County } from './county.entity';
import { PropertyHomeownerEnrichment } from './property-homeowner-enrichment.entity';
import { PropertyAiFiltering } from './property-ai-filtering.entity';
import { Dealmachine } from './dealmachine.entity';
import { PropertyBaseEnrichment } from './property-base-enrichment.entity';
import { AiStatus } from '../../enums/property/ai-status.enum';
import { PropertyPhotoAsset } from './property-photo-asset.entity';
import { PropertyMosaic } from './property-mosaic.entity';

@Entity('properties')
export class Property {
    @ApiProperty({required: true})
    @PrimaryGeneratedColumn('uuid')
    id?: string;

    @ApiProperty({required: false})
    @ManyToOne(() => County, (county) => county.properties, {nullable: true})
    @JoinColumn({name: 'countyId'})
    county?: County;

    @Index()
    @ApiProperty({required: false})
    @Column({ type: 'uuid', nullable: true })
    countyId?: string;

    /* FILLED OUT BY OUR SCRAPPER */
    @Index()
    @ApiProperty({required: false})
    @Type(() => String)
    @IsNumberString()
    @Column({nullable: true})
    zpid: string;

    @OneToOne(() => PropertyHomeownerEnrichment, (enrichment) => enrichment.property, { cascade: true })
    @JoinColumn()
    homeownerEnrichment?: PropertyHomeownerEnrichment;

    @ApiPropertyOptional({ type: () => PropertyAiFiltering })
    @IsOptional()
    @OneToOne(() => PropertyAiFiltering, (aiFiltering) => aiFiltering.property, { cascade: true, nullable: true })
    aiFiltering?: PropertyAiFiltering;


    /* GETTING FROM ZILLOW BRIGHT DATA API */
    @ApiProperty({ default: false })
    @IsBoolean()
    @IsOptional()
    @Column({name: 'enriched', nullable: false, default: false})
    enriched?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  @Column({name: 'mosaic', nullable: true})
  mosaic?: boolean;

  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  @Column({name: 'filtered', nullable: true})
  filtered?: boolean;


    @Index('idx_properties_ai_status')
    @ApiProperty({ required: false, enum: AiStatus })
    @IsEnum(AiStatus)
    @Column({
        name: 'ai_status',
        type: 'enum',
        enum: AiStatus,
        default: AiStatus.MOSAIC_PENDING,
    })
    aiStatus?: AiStatus;

    @ApiPropertyOptional()
    @IsOptional()
    @Column({ name: 'enrich_claimed_until', type: 'timestamptz', nullable: true })
    enrichClaimedUntil?: Date;

    @ApiPropertyOptional()
    @IsOptional()
    @Column({ name: 'enrich_claimed_by', type: 'text', nullable: true })
    enrichClaimedBy?: string;

    @Index('idx_properties_shard_key')
    @ApiPropertyOptional()
    @IsOptional()
    @Type(() => Number)
    @Column({ name: 'shard_key', type: 'int', nullable: true })
    shardKey?: number;


    // address.street_address
    @ApiProperty({required: false})
    @IsOptional()
    @Column({name: 'street_address', nullable: true})
    streetAddress?: string; // streetAddress

    // address.zipcode
    @ApiProperty({required: false})
    @Type(() => String)
    @IsOptional()
    @Column({nullable: true})
    zipcode?: string;

    //  address.city
    @ApiProperty({required: false})
    @IsOptional()
    @Column({nullable: true})
    city?: string;

    //  address.state
    @ApiProperty({required: false})
    @IsOptional()
    @Column({nullable: true})
    state?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsBoolean()
    @Column({ name: 'has_3d_model', type: 'boolean', nullable: true })
    has3DModel?: boolean;

    @ApiProperty({ required: false })
    @IsOptional()
    @Column({ name: 'img_src', nullable: true })
    imgSrc?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Column({ name: 'broker_name', nullable: true })
    brokerName?: string;

    // bedrooms
    @ApiProperty({required: false})
    @Type(() => Number)
    @IsOptional()
    @Column({type: 'float', nullable: true})
    bedrooms?: number;

    // bathrooms
    @ApiProperty({required: false})
    @Type(() => Number)
    @IsOptional()
    @Column({type: 'float', nullable: true})
    bathrooms?: number;

    // price
    @ApiProperty({required: false})
    @Type(() => String)
    @IsOptional()
    @IsNumberString()
    @Column('numeric',  { precision: 12, scale: 0,  nullable: true })
    price?: number;

    // home_type
    @ApiProperty({required: false})
    @IsOptional()
    @Column({name: 'home_type', nullable: true})
    homeType?: string; // homeType

    // longitude
    @ApiProperty({required: false})
    @IsOptional()
    @Type(() => String)
    @Column({nullable: true})
    longitude?: string;

    // latitude
    @ApiProperty({required: false})
    @IsOptional()
    @Type(() => String)
    @Column({ nullable: true})
    latitude?: string;


    // living_area_value
    @ApiProperty({required: false})
    @Type(() => String)
    @IsOptional()
    @IsNumberString()
    @Column({name: 'living_area_value', nullable: true})
    livingAreaValue?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Column({ name: 'lot_area_unit', nullable: true })
    lotAreaUnit?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @Column({ name: 'lot_area_value', type: 'numeric', precision: 14, scale: 2, nullable: true })
    lotAreaValue?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @Column({ name: 'url', nullable: true })
    url?: string;

    // days_on_zillow
    @ApiProperty({required: false})
    @Type(() => Number)
    @IsOptional()
    @Column({name: 'days_on_zillow', nullable: true, type: 'float'})
    daysOnZillow?: number;

    // time on zillow
    @ApiProperty({required: false})
    @Type(() => String)
    @IsOptional()
    @IsNumberString()
    @Column({name: 'time_on_zillow', nullable: true})
    timeOnZillow?: string; //

    @ApiProperty({required: false})
    @IsOptional()
    @Column({name: 'county_zillow', nullable: true})
    countyZillow?: string;

    /* DEFAULT */
    @ApiProperty({required: false})
    @CreateDateColumn({name: 'created_at'})
    createdAt?: Date;

    @ApiProperty({required: false})
    @UpdateDateColumn({name: 'updated_at'})
    updatedAt?: Date;

    @ApiProperty({required: false})
    @IsOptional()
    @OneToMany(() : typeof Dealmachine => Dealmachine, (dealmachine) => dealmachine.property)
    dealmachine?: Dealmachine[];

    @ApiProperty({ required: false, type: () => [PropertyPhotoAsset] })
    @IsOptional()
    @OneToMany(() => PropertyPhotoAsset, (asset) => asset.property)
    photoAssets?: PropertyPhotoAsset[];

  @ApiPropertyOptional({ required: false, type: () => PropertyBaseEnrichment })
  @OneToOne(() => PropertyBaseEnrichment, (enrichment) => enrichment.property, { cascade: true, nullable: true, eager: true })
  @IsOptional()
  baseEnrichment?: PropertyBaseEnrichment;

  @ApiPropertyOptional({ required: false, type: () => PropertyMosaic })
  @IsOptional()
  @OneToOne(() => PropertyMosaic, (mosaic) => mosaic.property, { cascade: true, nullable: true })
  mosaicAsset?: PropertyMosaic;
}
