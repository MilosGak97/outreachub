import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty,  IsString } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../company.entity';
import { CrmObjectType } from './crm-object-type.entity';
import { CrmObjectAssociation } from './crm-object-association.entity';
import {
  FieldValue,
} from '../../interfaces/object-field-values.interface';

@Entity('crm-objects')
export class CrmObject {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => CrmObjectType })
  @ManyToOne(() => CrmObjectType, (objectType) => objectType.objects)
  objectType: CrmObjectType;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, (company) => company.objects)
  company: Company;

  @ApiProperty({ required: true })
  @OneToMany(
    (): typeof CrmObjectAssociation => CrmObjectAssociation,
    (assoc: CrmObjectAssociation): CrmObject => assoc.sourceObject,
  )
  sourceAssociations: CrmObjectAssociation[];

  @OneToMany(
    (): typeof CrmObjectAssociation => CrmObjectAssociation,
    (assoc: CrmObjectAssociation): CrmObject => assoc.targetObject,
  )
  targetAssociations: CrmObjectAssociation[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Column()
  displayName: string;

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      oneOf: [
        { type: 'string' },
        { type: 'number' },
        { type: 'boolean' },
        { type: 'object' }, // JSON
        { type: 'string', format: 'date-time' }, // Date
        { type: 'null' },
      ],
    },
    description: 'Dynamic key-value fields based on object field definitions',
  })
  @Column({ type: 'jsonb', default: {} })
  fieldValues: Record<string, FieldValue>; // Uses FieldValue, which doesn't have any

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
