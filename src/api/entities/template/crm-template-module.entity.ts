import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CrmTemplate } from './crm-template.entity';
import { CrmTemplateBlueprintAssociation } from './crm-template-blueprint-association.entity';
import { CrmTemplateBlueprintObject } from './crm-template-blueprint-object.entity';

@Entity('crm_template_module')
@Index(['templateId', 'slug'], { unique: true })
export class CrmTemplateModule {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @ApiProperty({ type: () => CrmTemplate })
  @ManyToOne(() => CrmTemplate, (template) => template.modules, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'template_id' })
  template: CrmTemplate;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty()
  @Index()
  @Column({ type: 'varchar', length: 100 })
  slug: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty()
  @Column({ name: 'is_core', type: 'boolean', default: false })
  isCore: boolean;

  @ApiPropertyOptional({ isArray: true })
  @Column({ name: 'depends_on', type: 'simple-array', nullable: true, default: [] })
  dependsOn?: string[];

  @ApiPropertyOptional({ isArray: true })
  @Column({
    name: 'conflicts_with',
    type: 'simple-array',
    nullable: true,
    default: [],
  })
  conflictsWith?: string[];

  @ApiProperty()
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @ApiProperty({ type: () => CrmTemplateBlueprintObject, isArray: true, required: false })
  @OneToMany(() => CrmTemplateBlueprintObject, (object) => object.module, {
    cascade: true,
  })
  blueprintObjects?: CrmTemplateBlueprintObject[];

  @ApiProperty({ type: () => CrmTemplateBlueprintAssociation, isArray: true, required: false })
  @OneToMany(
    () => CrmTemplateBlueprintAssociation,
    (association) => association.module,
    { cascade: true },
  )
  blueprintAssociations?: CrmTemplateBlueprintAssociation[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
