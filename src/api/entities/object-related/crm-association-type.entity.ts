import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Company } from '../company.entity';

@Entity('crm-association-types')
export class CrmAssociationType {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Company })
  @ManyToOne(():typeof Company=> Company, (company: Company): CrmAssociationType[] => company.crmAssociationTypes)
  company: Company;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Column()
  name: string; // e.g., "Owns Company"

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Column({ name: 'api_name' })
  apiName: string; // e.g., "OWNS_COMPANY"

  @ApiProperty({ required: false })
  @Column({ nullable: true })
  description?: string;

  @Column({ default: false })
  isBidirectional: boolean; // If relationship works both ways

  @Column({ nullable: true })
  reverseName?: string; // e.g., "Has Employee"
}