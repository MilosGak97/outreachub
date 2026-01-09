import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../company.entity';
import { ImportSession } from './import-session.entity';
import { CrmObjectType } from '../object/crm-object-type.entity';
import { ImportMatchBehavior } from '../../enums/import/import-match-behavior.enum';

@Entity('import-object-maps')
export class ImportObjectMap {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @ApiProperty({ type: () => ImportSession })
  @ManyToOne(() => ImportSession, { onDelete: 'CASCADE' })
  importSession: ImportSession;

  @ApiProperty({ type: () => CrmObjectType })
  @ManyToOne(() => CrmObjectType, { onDelete: 'RESTRICT' })
  objectType: CrmObjectType;

  @ApiProperty({ enum: ImportMatchBehavior })
  @Column({ name: 'match_behavior', type: 'enum', enum: ImportMatchBehavior, default: ImportMatchBehavior.CREATE })
  matchBehavior: ImportMatchBehavior;
}
