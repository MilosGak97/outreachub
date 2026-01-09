import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { FieldType } from '../../client/object-related/crm-object-field/field-types/field-type.enum';
import { CrmObjectType } from './crm-object-type.entity';
import { Company } from '../company.entity';
import {
  TemplateItemProtection,
  TemplateItemProtectionEnumName,
} from '../../enums/template/template-item-protection.enum';

@Entity('crm-object-fields')
@Unique(['apiName', 'company'])
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

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ enum: FieldType, enumName: 'FieldType' })
  @IsEnum(FieldType)
  @Column({ name: 'field_type', type: 'enum', enum: FieldType })
  fieldType: FieldType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Column({ name: 'api_name', nullable: true })
  apiName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsOptional()
  @IsBoolean()
  @Column({ name: 'is_required' , default: false, nullable: true })
  isRequired?: boolean;

  @ApiProperty({ type: () => Company, required: true })
  @ManyToOne(() => Company, (company) => company.crmObjectFields)
  company: Company;

  @ApiProperty({ required: false, description: 'Defines the object shape structure (e.g. PHONE)' })
  @IsOptional()
  @Column({ type: 'jsonb', nullable: true })
  shape?: Record<string, any>;

  @ApiProperty({ required: false, description: 'Defines the configuration structure (e.g. options for SELECT)' })
  @IsOptional()
  @Column({name: 'config_shape', type: 'jsonb', nullable: true })
  configShape?: Record<string, any>;

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
