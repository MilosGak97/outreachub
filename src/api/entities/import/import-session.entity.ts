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
import { User } from '../user.entity';
import { ImportFile } from './import-file.entity';
import { ImportSessionStatus } from '../../enums/import/import-session-status.enum';

@Entity('import-sessions')
export class ImportSession {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @ApiProperty({ type: () => User, required: false })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  createdBy?: User;

  @ApiProperty({ enum: ImportSessionStatus })
  @Column({ name: 'status', type: 'enum', enum: ImportSessionStatus, default: ImportSessionStatus.DRAFT })
  status: ImportSessionStatus;

  @ApiProperty({ type: () => ImportFile })
  @ManyToOne(() => ImportFile, { onDelete: 'RESTRICT' })
  file: ImportFile;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
