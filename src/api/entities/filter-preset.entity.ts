import { ApiProperty } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from './company.entity';
import {
  FilterPresetOwnerType,
  FilterPresetOwnerTypeEnumName,
} from '../enums/filter-preset/filter-preset-owner-type.enum';

@Entity('filter_presets')
@Index('idx_filter_presets_context', ['companyId', 'ownerType', 'ownerId', 'conceptKey', 'tableId'])
@Index(
  'uniq_filter_presets_name',
  ['companyId', 'ownerType', 'ownerId', 'conceptKey', 'tableId', 'name'],
  { unique: true },
)
@Index(
  'uniq_filter_presets_default',
  ['companyId', 'ownerType', 'ownerId', 'conceptKey', 'tableId'],
  { unique: true, where: '"is_default" = true' },
)
export class FilterPreset {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty({
    enum: FilterPresetOwnerType,
    enumName: FilterPresetOwnerTypeEnumName,
  })
  @Column({
    name: 'owner_type',
    type: 'enum',
    enum: FilterPresetOwnerType,
    enumName: FilterPresetOwnerTypeEnumName,
  })
  ownerType: FilterPresetOwnerType;

  @ApiProperty()
  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @ApiProperty()
  @Column({ name: 'concept_key' })
  conceptKey: string;

  @ApiProperty()
  @Column({ name: 'table_id' })
  tableId: string;

  @ApiProperty()
  @Column()
  name: string;

  @ApiProperty()
  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @ApiProperty({ type: 'object' })
  @Column({ name: 'filter_state', type: 'jsonb' })
  filterState: Record<string, any>;

  @ApiProperty()
  @Column({ type: 'int', default: 1 })
  version: number;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
