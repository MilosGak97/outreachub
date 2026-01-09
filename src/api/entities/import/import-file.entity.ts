import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../company.entity';

@Entity('import-files')
export class ImportFile {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @ApiProperty({ required: false })
  @Column({ name: 'storage_key', nullable: true })
  storageKey?: string;

  @ApiProperty()
  @Column()
  filename: string;

  @ApiProperty()
  @Column({ name: 'mime_type' })
  mimeType: string;

  @ApiProperty()
  @Column({ type: 'bigint' })
  size: number;

  @ApiProperty({ default: true })
  @Column({ name: 'has_header', default: true })
  hasHeader: boolean;

  @ApiProperty({ type: [String], required: false })
  @Column({ type: 'jsonb', default: [] })
  columns: string[];

  @ApiProperty({
    type: [Object],
    required: false,
    description: 'Sample rows as arrays of column values',
  })
  @Column({ name: 'sample_rows', type: 'jsonb', default: [] })
  sampleRows: any[][];

  @ApiProperty({ required: false })
  @Column({ name: 'row_count', type: 'int', nullable: true })
  rowCount?: number;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
