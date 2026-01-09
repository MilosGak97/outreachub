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
} from 'typeorm';
import {
  TemplateItemProtection,
  TemplateItemProtectionEnumName,
} from '../../enums/template/template-item-protection.enum';
import { CrmTemplateModule } from './crm-template-module.entity';
import { CrmTemplateBlueprintField } from './crm-template-blueprint-field.entity';

@Entity('crm_template_blueprint_object')
@Index(['moduleId', 'apiName'], { unique: true })
export class CrmTemplateBlueprintObject {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'module_id', type: 'uuid' })
  moduleId: string;

  @ApiProperty({ type: () => CrmTemplateModule })
  @ManyToOne(() => CrmTemplateModule, (module) => module.blueprintObjects, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'module_id' })
  module: CrmTemplateModule;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty()
  @Column({ name: 'api_name', type: 'varchar', length: 100 })
  apiName: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty({
    enum: TemplateItemProtection,
    enumName: TemplateItemProtectionEnumName,
  })
  @Column({
    type: 'enum',
    enum: TemplateItemProtection,
    enumName: TemplateItemProtectionEnumName,
    default: TemplateItemProtection.NONE,
  })
  protection: TemplateItemProtection;

  @ApiProperty()
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder: number;

  @ApiProperty({ type: () => CrmTemplateBlueprintField, isArray: true, required: false })
  @OneToMany(() => CrmTemplateBlueprintField, (field) => field.blueprintObject, {
    cascade: true,
  })
  fields?: CrmTemplateBlueprintField[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
