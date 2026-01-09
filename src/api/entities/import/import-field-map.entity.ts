import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../company.entity';
import { ImportObjectMap } from './import-object-map.entity';
import { CrmObjectField } from '../object/crm-object-field.entity';
import { ImportDraftField } from './import-draft-field.entity';

@Entity('import-field-maps')
export class ImportFieldMap {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @ApiProperty({ type: () => ImportObjectMap })
  @ManyToOne(() => ImportObjectMap, { onDelete: 'CASCADE' })
  objectMap: ImportObjectMap;

  @ApiProperty()
  @Column({ name: 'source_index', type: 'int' })
  sourceIndex: number;

  @ApiProperty({ type: () => CrmObjectField, required: false })
  @ManyToOne(() => CrmObjectField, { onDelete: 'SET NULL', nullable: true })
  targetField?: CrmObjectField;

  @ApiProperty({ type: () => ImportDraftField, required: false })
  @ManyToOne(() => ImportDraftField, { onDelete: 'SET NULL', nullable: true })
  draftField?: ImportDraftField;

  @ApiProperty({ required: false, type: 'object' })
  @Column({ name: 'default_value', type: 'jsonb', nullable: true })
  defaultValue?: Record<string, any>;

  @ApiProperty({ required: false, type: 'object' })
  @Column({ name: 'transform_rule', type: 'jsonb', nullable: true })
  transformRule?: Record<string, any>;
}
