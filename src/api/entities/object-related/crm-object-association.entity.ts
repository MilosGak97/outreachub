import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Company } from '../company.entity';
import { CrmObject } from './crm-object.entity';
import { CrmAssociationType } from './crm-association-type.entity';

@Entity('crm-object-associations')
export class CrmObjectAssociation {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company, required: true })
  @ManyToOne(() => Company, (company) => company.objectAssociations)
  company: Company;

  @ApiProperty({ type: () => CrmObject, required: true })
  @ManyToOne(() => CrmObject, (object) => object.sourceAssociations)
  sourceObject: CrmObject;

  @ApiProperty({ type: () => CrmObject, required: true })
  @ManyToOne(() => CrmObject, (object) => object.targetAssociations)
  targetObject: CrmObject;

  @ApiProperty({ type: () => CrmAssociationType })
  @ManyToOne(() => CrmAssociationType)
  type: CrmAssociationType;

  @ApiProperty({ type: (): typeof CrmObjectAssociation => CrmObjectAssociation, required: false })
  @ManyToOne(
    (): typeof CrmObjectAssociation => CrmObjectAssociation,
    (objectAssociation: CrmObjectAssociation): string =>
      objectAssociation.id,
    { nullable: true },
  )
  reverseOf?: CrmObjectAssociation;

  @ApiProperty({ required: false })
  @IsOptional()
  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
