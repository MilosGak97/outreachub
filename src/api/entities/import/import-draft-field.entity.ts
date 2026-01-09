import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../company.entity';
import { ImportSession } from './import-session.entity';
import { CrmObjectType } from '../object/crm-object-type.entity';
import { FieldType } from '../../client/object-related/crm-object-field/field-types/field-type.enum';

@Entity('import-draft-fields')
export class ImportDraftField {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @ApiProperty({ type: () => ImportSession })
  @ManyToOne(() => ImportSession, { onDelete: 'CASCADE' })
  importSession: ImportSession;

  @ApiProperty({ type: () => CrmObjectType })
  @ManyToOne(() => CrmObjectType, { onDelete: 'RESTRICT' })
  objectType: CrmObjectType;

  @ApiProperty()
  @IsString()
  @Column()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Column({ name: 'api_name', nullable: true })
  apiName?: string;

  @ApiProperty({ enum: FieldType })
  @IsEnum(FieldType)
  @Column({ name: 'field_type', type: 'enum', enum: FieldType })
  fieldType: FieldType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Column({ nullable: true })
  description?: string;

  @ApiProperty({ required: false })
  @Column({ name: 'is_required', default: false })
  isRequired?: boolean;

  @ApiProperty({ required: false })
  @Column({ type: 'jsonb', nullable: true })
  shape?: Record<string, any>;

  @ApiProperty({ required: false })
  @Column({ name: 'config_shape', type: 'jsonb', nullable: true })
  configShape?: Record<string, any>;
}
