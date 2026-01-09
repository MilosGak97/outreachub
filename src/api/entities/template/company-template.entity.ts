import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Company } from '../company.entity';
import { CrmTemplate } from './crm-template.entity';

@Entity('company_template')
@Index(['companyId'], { unique: true })
export class CompanyTemplate {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ name: 'company_id', type: 'uuid' })
  companyId: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ApiProperty()
  @Column({ name: 'template_id', type: 'uuid' })
  templateId: string;

  @ApiProperty({ type: () => CrmTemplate })
  @ManyToOne(() => CrmTemplate, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'template_id' })
  template: CrmTemplate;

  @ApiProperty()
  @CreateDateColumn({ name: 'installed_at' })
  installedAt: Date;

  @ApiPropertyOptional()
  @Column({ name: 'installed_by', type: 'uuid', nullable: true })
  installedBy?: string;
}
