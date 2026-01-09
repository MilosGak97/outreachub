import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../company.entity';
import { ImportSession } from './import-session.entity';
import { ImportJobStatus } from '../../enums/import/import-job-status.enum';

@Entity('import-jobs')
export class ImportJob {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @ApiProperty({ type: () => ImportSession })
  @ManyToOne(() => ImportSession, { onDelete: 'CASCADE' })
  importSession: ImportSession;

  @ApiProperty({ enum: ImportJobStatus })
  @Column({ type: 'enum', enum: ImportJobStatus, default: ImportJobStatus.QUEUED })
  status: ImportJobStatus;

  @ApiPropertyOptional()
  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date;

  @ApiPropertyOptional()
  @Column({ name: 'finished_at', type: 'timestamp', nullable: true })
  finishedAt?: Date;

  @ApiProperty()
  @Column({ name: 'created_count', type: 'int', default: 0 })
  createdCount: number;

  @ApiProperty()
  @Column({ name: 'updated_count', type: 'int', default: 0 })
  updatedCount: number;

  @ApiProperty()
  @Column({ name: 'skipped_count', type: 'int', default: 0 })
  skippedCount: number;

  @ApiProperty()
  @Column({ name: 'linked_count', type: 'int', default: 0 })
  linkedCount: number;

  @ApiPropertyOptional()
  @Column({ name: 'error_report_key', nullable: true })
  errorReportKey?: string;
}
