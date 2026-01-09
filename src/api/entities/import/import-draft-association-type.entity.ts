import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, Matches } from 'class-validator';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../company.entity';
import { ImportSession } from './import-session.entity';
import { CrmObjectType } from '../object/crm-object-type.entity';
import { AssociationCardinality } from '../../enums/object/association-cardinality.enum';

@Entity('import-draft-association-types')
export class ImportDraftAssociationType {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @ApiProperty({ type: () => ImportSession })
  @ManyToOne(() => ImportSession, { onDelete: 'CASCADE' })
  importSession: ImportSession;

  @ApiProperty({ type: () => CrmObjectType, required: true })
  @ManyToOne(() => CrmObjectType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'source_object_type_id' })
  sourceObjectType: CrmObjectType;

  @ApiProperty({ type: () => CrmObjectType, required: true })
  @ManyToOne(() => CrmObjectType, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'target_object_type_id' })
  targetObjectType: CrmObjectType;

  @ApiProperty({
    enum: AssociationCardinality,
    enumName: 'AssociationCardinality',
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
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/)
  @Column({ name: 'api_name' })
  apiName: string;

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ default: true })
  @Column({ name: 'is_bidirectional', default: true })
  isBidirectional: boolean;

  @ApiProperty({ required: false })
  @Column({ name: 'reverse_name', nullable: true })
  reverseName?: string;
}
