import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../company.entity';
import { ImportObjectMap } from './import-object-map.entity';

@Entity('import-match-rules')
export class ImportMatchRule {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @ApiProperty({ type: () => ImportObjectMap })
  @ManyToOne(() => ImportObjectMap, { onDelete: 'CASCADE' })
  objectMap: ImportObjectMap;

  @ApiProperty({ type: [String] })
  @Column({ name: 'match_fields', type: 'jsonb', default: [] })
  matchFields: string[];
}
