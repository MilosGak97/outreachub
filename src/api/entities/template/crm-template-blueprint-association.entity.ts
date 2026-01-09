import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AssociationCardinality } from '../../enums/object/association-cardinality.enum';
import {
  TemplateItemProtection,
  TemplateItemProtectionEnumName,
} from '../../enums/template/template-item-protection.enum';
import { CrmTemplateModule } from './crm-template-module.entity';

@Entity('crm_template_blueprint_association')
@Index(['moduleId', 'apiName'], { unique: true })
export class CrmTemplateBlueprintAssociation {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'module_id', type: 'uuid' })
  moduleId: string;

  @ApiProperty({ type: () => CrmTemplateModule })
  @ManyToOne(() => CrmTemplateModule, (module) => module.blueprintAssociations, {
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

  @ApiProperty()
  @Column({ name: 'source_object_api_name', type: 'varchar', length: 100 })
  sourceObjectApiName: string;

  @ApiProperty()
  @Column({ name: 'target_object_api_name', type: 'varchar', length: 100 })
  targetObjectApiName: string;

  @ApiProperty({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
  })
  @IsEnum(AssociationCardinality)
  @Column({
    name: 'source_cardinality',
    type: 'enum',
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
  })
  sourceCardinality: AssociationCardinality;

  @ApiProperty({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
  })
  @IsEnum(AssociationCardinality)
  @Column({
    name: 'target_cardinality',
    type: 'enum',
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
  })
  targetCardinality: AssociationCardinality;

  @ApiProperty({ default: true })
  @Column({ name: 'is_bidirectional', type: 'boolean', default: true })
  isBidirectional: boolean;

  @ApiPropertyOptional()
  @Column({ name: 'reverse_name', type: 'varchar', length: 255, nullable: true })
  reverseName?: string;

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

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
