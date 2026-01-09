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
import {
  TemplateItemProtection,
  TemplateItemProtectionEnumName,
} from '../../enums/template/template-item-protection.enum';

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
  name: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Matches(/^[a-z][a-z0-9_]*$/)
  @Column({ name: 'api_name' })
  apiName: string;

  @ApiProperty({ required: false })
  @IsString()
  @Column({ nullable: true })
  description?: string;

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

  @ApiProperty({
    type: (): typeof CrmObjectField => CrmObjectField,
    isArray: true,
    required: false,
  })
  @OneToMany(
    (): typeof CrmObjectField => CrmObjectField,
    (objectField: CrmObjectField): CrmObjectType => objectField.objectType,
  )
  fields?: CrmObjectField[];

  @ApiProperty({
    type: (): typeof Object => Object,
    isArray: true,
    required: false,
  })
  @OneToMany(
    (): typeof CrmObject => CrmObject,
    (object: CrmObject): CrmObjectType => object.objectType,
  )
  objects?: CrmObject[];

  @ApiProperty()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
