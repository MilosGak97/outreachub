import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Company } from '../company.entity';
import { CrmObjectField } from './crm-object-field.entity';
import { CrmObject } from './crm-object.entity';

@Entity('crm-object-types')
export class CrmObjectType {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string; // NOT NULL in DB, required in API

  @ApiProperty({ type: () => Company })
  @ManyToOne((): typeof Company => Company, (company:Company): CrmObjectType[] => company.crmObjectTypes)
  company: Company; // NOT NULL (required relationship)

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Column()
  name: string; // NOT NULL in DB, required in API

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/)
  @Column({ name: 'api_name' })
  apiName: string; // NOT NULL in DB, required in API

  @ApiProperty({ required: false })
  @IsString()
  @Column({ nullable: true })
  description?: string; // NULLABLE in DB, optional in API

  @ApiProperty({
    type: (): typeof CrmObjectField => CrmObjectField,
    isArray: true,
    required: false,
  })
  @OneToMany(
    (): typeof CrmObjectField => CrmObjectField,
    (objectField: CrmObjectField): CrmObjectType => objectField.objectType,
  )
  fields?: CrmObjectField[]; // Optional array (automatically nullable in TypeORM)

  @ApiProperty({
    type: (): typeof Object => Object,
    isArray: true,
    required: false,
  })
  @OneToMany(
    (): typeof CrmObject => CrmObject,
    (object: CrmObject): CrmObjectType => object.objectType,
  )
  objects?: CrmObject[]; // Optional array (automatically nullable in TypeORM)

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date; // NOT NULL in DB (auto-set), required in API
}
