
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { StatesAbbreviation } from '../../enums/common/states-abbreviation.enum';

@Entity('property-summary')
export class PropertySummary {
  @ApiProperty()
  @PrimaryColumn({ name: 'run_date', type: 'date' })
  runDate: string;

  @ApiProperty({ enum: StatesAbbreviation, enumName: 'StatesAbbreviation' })
  @PrimaryColumn({ name: 'state', type: 'varchar', length: 2 })
  state: StatesAbbreviation;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'total_jobs', type: 'int', default: 0 })
  totalJobs: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'success', type: 'int', default: 0 })
  success: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'pending', type: 'int', default: 0 })
  pending: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'running', type: 'int', default: 0 })
  running: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'failed', type: 'int', default: 0 })
  failed: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'retrying', type: 'int', default: 0 })
  retrying: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'changed_count', type: 'int', default: 0 })
  changedCount: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'new_count', type: 'int', default: 0 })
  newCount: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'changed_and_new_count', type: 'int', default: 0 })
  changedAndNewCount: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'remaining', type: 'int', default: 0 })
  remaining: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'enriched_remaining', type: 'int', default: 0 })
  enrichedRemaining: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'enriched_completed', type: 'int', default: 0 })
  enrichedCompleted: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'mosaic_remaining', type: 'int', default: 0 })
  mosaicRemaining: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'mosaic_completed', type: 'int', default: 0 })
  mosaicCompleted: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'filtered_remaining', type: 'int', default: 0 })
  filteredRemaining: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'filtered_completed', type: 'int', default: 0 })
  filteredCompleted: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'import_completed', type: 'int', default: 0 })
  importCompleted: number;

  @ApiProperty()
  @Type(() => Number)
  @Column({ name: 'import_remaining', type: 'int', default: 0 })
  importRemaining: number;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
