import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../company.entity';
import { ImportSession } from './import-session.entity';
import { ImportLinkMode } from '../../enums/import/import-link-mode.enum';
import { CrmAssociationType } from '../object/crm-association-type.entity';
import { ImportDraftAssociationType } from './import-draft-association-type.entity';
import { CrmObjectType } from '../object/crm-object-type.entity';

@Entity('import-link-rules')
export class ImportLinkRule {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @ApiProperty({ type: () => ImportSession })
  @ManyToOne(() => ImportSession, { onDelete: 'CASCADE' })
  importSession: ImportSession;

  @ApiProperty({ enum: ImportLinkMode })
  @Column({ type: 'enum', enum: ImportLinkMode, default: ImportLinkMode.SKIP })
  mode: ImportLinkMode;

  @ApiPropertyOptional({ type: () => CrmAssociationType })
  @ManyToOne(() => CrmAssociationType, { onDelete: 'SET NULL', nullable: true })
  associationType?: CrmAssociationType;

  @ApiPropertyOptional({ type: () => ImportDraftAssociationType })
  @ManyToOne(() => ImportDraftAssociationType, { onDelete: 'SET NULL', nullable: true })
  draftAssociationType?: ImportDraftAssociationType;

  @ApiPropertyOptional({ type: () => CrmObjectType })
  @ManyToOne(() => CrmObjectType, { onDelete: 'RESTRICT', nullable: true })
  sourceObjectType?: CrmObjectType;

  @ApiPropertyOptional({ type: () => CrmObjectType })
  @ManyToOne(() => CrmObjectType, { onDelete: 'RESTRICT', nullable: true })
  targetObjectType?: CrmObjectType;

  @ApiPropertyOptional()
  @Column({ name: 'source_match_field', nullable: true })
  sourceMatchField?: string;

  @ApiPropertyOptional()
  @Column({ name: 'target_match_field', nullable: true })
  targetMatchField?: string;
}
