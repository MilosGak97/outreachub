import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Property } from './property.entity';
import { FilteredStatus } from '../../enums/property/filtered-status.enum';
import { IsEnum } from 'class-validator';
import { AiFilteringJobStatus } from '../../enums/property/ai-filtering-job-status.enum';

@Entity('property-ai-filtering')
export class PropertyAiFiltering{
    @ApiProperty({required: true})
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => Property, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'property_id' })
    property: Property;

    @ApiProperty({ required: true, enum: AiFilteringJobStatus })
    @IsEnum(AiFilteringJobStatus)
    @Column({
        name: 'job_status',
        type: 'enum',
        enum: AiFilteringJobStatus,
        default: AiFilteringJobStatus.PENDING,
    })
    jobStatus: AiFilteringJobStatus;


    @ApiProperty({required: true, enum: FilteredStatus})
    @IsEnum(FilteredStatus)
    @Column({name: 'filtered_status', type: 'enum', enum: FilteredStatus, nullable:true})
    filteredStatus?: FilteredStatus;

    @ApiProperty({required: false})
    @Column({name: 'raw_response', nullable: true})
    rawResponse?: string;


  @ApiProperty({required: false})
  @CreateDateColumn({name: 'created_at'})
  createdAt?: Date;

  @ApiProperty({required: false})
  @UpdateDateColumn({name: 'updated_at'})
  updatedAt?: Date;
}
