import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Company } from '../company.entity';
import { CrmObjectType } from './crm-object-type.entity';
import { AssociationCardinality } from '../../enums/object/association-cardinality.enum';
import {
  TemplateItemProtection,
  TemplateItemProtectionEnumName,
} from '../../enums/template/template-item-protection.enum';

@Entity('crm-association-types')
@Unique(['apiName', 'company'])
@Index(['company', 'sourceObjectType'])
@Index(['company', 'targetObjectType'])
export class CrmAssociationType {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(
    (): typeof Company => Company,
    (company: Company): CrmAssociationType[] => company.crmAssociationTypes,
  )
  company: Company;

  @ApiProperty({ type: () => CrmObjectType, required: true })
  @ManyToOne((): typeof CrmObjectType => CrmObjectType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'source_object_type_id' })
  sourceObjectType: CrmObjectType;

  @ApiProperty({ type: () => CrmObjectType, required: true })
  @ManyToOne((): typeof CrmObjectType => CrmObjectType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'target_object_type_id' })
  targetObjectType: CrmObjectType;

  @ApiProperty({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
    description: 'Max number of targets per source for this association type.',
  })
  @IsEnum(AssociationCardinality)
  @Column({
    name: 'source_cardinality',
    type: 'enum',
    enum: AssociationCardinality,
    default: AssociationCardinality.MANY,
  })
  sourceCardinality: AssociationCardinality;

  @ApiProperty({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
    description: 'Max number of sources per target for this association type.',
  })
  @IsEnum(AssociationCardinality)
  @Column({
    name: 'target_cardinality',
    type: 'enum',
    enum: AssociationCardinality,
    default: AssociationCardinality.MANY,
  })
  targetCardinality: AssociationCardinality;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Column()
  name: string; // e.g., "Owns Company"

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/)
  @Column({ name: 'api_name' })
  apiName: string; // e.g., "owns_company"

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ default: true })
  @Column({ name: 'is_bidirectional', default: true })
  isBidirectional: boolean; // If relationship works both ways

  @ApiProperty({ required: false })
  @Column({ name: 'reverse_name', nullable: true })
  reverseName?: string; // e.g., "Has Employee"

  @ApiProperty({ required: false })
  @Column({ type: 'uuid', nullable: true })
  templateOriginId: string | null;

  @ApiProperty({
    required: false,
    enum: TemplateItemProtection,
    enumName: TemplateItemProtectionEnumName,
  })
  @Column({
    type: 'enum',
    enum: TemplateItemProtection,
    enumName: TemplateItemProtectionEnumName,
    nullable: true,
  })
  protection: TemplateItemProtection | null;
}
