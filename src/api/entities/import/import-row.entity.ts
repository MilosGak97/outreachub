import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../company.entity';
import { ImportSession } from './import-session.entity';
import { ImportRowStatus } from '../../enums/import/import-row-status.enum';

@Entity('import-rows')
@Index(['importSession', 'rowId'])
export class ImportRow {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @ApiProperty({ type: () => ImportSession })
  @ManyToOne(() => ImportSession, { onDelete: 'CASCADE' })
  importSession: ImportSession;

  @ApiProperty()
  @Column({ name: 'row_index', type: 'int' })
  rowIndex: number;

  @ApiPropertyOptional()
  @Column({ name: 'row_id', nullable: true })
  rowId?: string;

  @ApiProperty({ type: [Object] })
  @Column({ name: 'raw_data', type: 'jsonb' })
  rawData: any[];

  @ApiPropertyOptional()
  @Column({ name: 'row_hash', nullable: true })
  rowHash?: string;

  @ApiProperty({ enum: ImportRowStatus })
  @Column({ type: 'enum', enum: ImportRowStatus, default: ImportRowStatus.PENDING })
  status: ImportRowStatus;
}
