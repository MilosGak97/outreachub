import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { FieldType } from '../../enums/field-type.enum';
import { CrmObjectType } from './crm-object-type.entity';
import { Company } from '../company.entity';

@Entity('crm-object-fields')
export class CrmObjectField {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => CrmObjectType })
  @ManyToOne(() => CrmObjectType, (objectType) => objectType.fields, { onDelete: 'CASCADE' })
  objectType: CrmObjectType;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Column()
  name: string;

  @ApiProperty({ enum: FieldType, enumName: 'FieldType' })
  @IsEnum(FieldType)
  @Column({ type: 'enum', enum: FieldType })
  type: FieldType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Column({ name: 'api_name', nullable: true })
  apiName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Column({ default: false })
  isRequired?: boolean;

  @ApiProperty({ type: () => Company, required: true })
  @ManyToOne(() => Company, (company) => company.crmObjectFields)
  company: Company;


  @ApiProperty({ required: false })
  @IsOptional()
  @Column({ type: 'jsonb', nullable: true })
  validationRules?: Record<string, any>;
}