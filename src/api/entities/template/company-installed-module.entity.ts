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
import { CrmTemplateModule } from './crm-template-module.entity';

@Entity('company_installed_module')
@Index(['companyId', 'moduleId'], { unique: true })
export class CompanyInstalledModule {
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
  @Column({ name: 'module_id', type: 'uuid' })
  moduleId: string;

  @ApiProperty({ type: () => CrmTemplateModule })
  @ManyToOne(() => CrmTemplateModule, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'module_id' })
  module: CrmTemplateModule;

  @ApiProperty()
  @CreateDateColumn({ name: 'installed_at' })
  installedAt: Date;

  @ApiPropertyOptional()
  @Column({ name: 'installed_by', type: 'uuid', nullable: true })
  installedBy?: string;
}
