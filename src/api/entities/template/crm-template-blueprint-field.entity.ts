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
import {
  TemplateItemProtection,
  TemplateItemProtectionEnumName,
} from '../../enums/template/template-item-protection.enum';
import { FieldType } from '../../client/object-related/crm-object-field/field-types/field-type.enum';
import { CrmTemplateBlueprintObject } from './crm-template-blueprint-object.entity';

@Entity('crm_template_blueprint_field')
@Index(['blueprintObjectId', 'apiName'], { unique: true })
export class CrmTemplateBlueprintField {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'blueprint_object_id', type: 'uuid' })
  blueprintObjectId: string;

  @ApiProperty({ type: () => CrmTemplateBlueprintObject })
  @ManyToOne(() => CrmTemplateBlueprintObject, (object) => object.fields, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'blueprint_object_id' })
  blueprintObject: CrmTemplateBlueprintObject;

  @ApiProperty()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ApiProperty()
  @Column({ name: 'api_name', type: 'varchar', length: 100 })
  apiName: string;

  @ApiProperty({ enum: FieldType, enumName: 'FieldType' })
  @IsEnum(FieldType)
  @Column({ name: 'field_type', type: 'enum', enum: FieldType, enumName: 'FieldType' })
  fieldType: FieldType;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description?: string;

  @ApiProperty()
  @Column({ name: 'is_required', type: 'boolean', default: false })
  isRequired: boolean;

  @ApiPropertyOptional()
  @Column({ type: 'jsonb', nullable: true })
  shape?: Record<string, any>;

  @ApiPropertyOptional()
  @Column({ name: 'config_shape', type: 'jsonb', nullable: true })
  configShape?: Record<string, any>;

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
