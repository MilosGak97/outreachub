import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../company.entity';
import { ImportSession } from './import-session.entity';
import { ImportRow } from './import-row.entity';
import { ImportObjectMap } from './import-object-map.entity';
import { ImportRowResultStatus } from '../../enums/import/import-row-result-status.enum';

@Entity('import-row-results')
@Index(['importSession', 'objectMap'])
export class ImportRowResult {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @ApiProperty({ type: () => ImportSession })
  @ManyToOne(() => ImportSession, { onDelete: 'CASCADE' })
  importSession: ImportSession;

  @ApiProperty({ type: () => ImportRow })
  @ManyToOne(() => ImportRow, { onDelete: 'CASCADE' })
  row: ImportRow;

  @ApiProperty({ type: () => ImportObjectMap })
  @ManyToOne(() => ImportObjectMap, { onDelete: 'CASCADE' })
  objectMap: ImportObjectMap;

  @ApiProperty({ enum: ImportRowResultStatus })
  @Column({ type: 'enum', enum: ImportRowResultStatus })
  status: ImportRowResultStatus;

  @ApiPropertyOptional()
  @Column({ name: 'object_id', nullable: true })
  objectId?: string;

  @ApiPropertyOptional({ type: 'object' })
  @Column({ type: 'jsonb', nullable: true })
  error?: Record<string, any>;
}
