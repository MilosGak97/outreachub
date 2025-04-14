import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { CompanyStatus } from 'src/api/enums/company-status.enum';
import { PhoneNumberTypeDto } from '../common/dto/phone-number-type.dto';
import { CrmObjectType } from './object-related/crm-object-type.entity';
import { CrmObject } from './object-related/crm-object.entity';
import { CrmAssociationType } from './object-related/crm-association-type.entity';
import { CrmObjectAssociation } from './object-related/crm-object-association.entity';

@Entity('companies')
export class Company {
  @ApiProperty({ required: true })
  @PrimaryGeneratedColumn('uuid')
  @IsNotEmpty()
  @IsString()
  id: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @Column({ nullable: false })
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Column({ nullable: true })
  address1?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Column({ nullable: true })
  address2?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Column({ nullable: true })
  city?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Column({ nullable: true })
  state?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Column({ name: 'zip_code', nullable: true })
  zipCode?: string;

  @ApiProperty({ required: true })
  @IsString()
  @IsNotEmpty()
  @Column({ nullable: false })
  website: string;

  // Store the phone object as JSON
  @ApiProperty({ required: false })
  @Column({ name: 'phone_number', type: 'json', nullable: true })
  phoneNumber?: PhoneNumberTypeDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsEmail()
  @Column({ nullable: true })
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Column({ name: 'logo_url', nullable: true })
  logoUrl?: string;

  @ApiProperty({ required: true, enum: CompanyStatus })
  @IsNotEmpty()
  @IsEnum(CompanyStatus)
  @Column({ nullable: true })
  status?: CompanyStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @OneToMany((): typeof User => User, (user: User): Company => user.company)
  users?: User[];

  @ApiProperty({ required: false })
  @OneToMany(
    (): typeof CrmObjectType => CrmObjectType,
    (objectType: CrmObjectType): Company => objectType.company,
  )
  objectTypes?: CrmObjectType[];

  @ApiProperty({ required: false })
  @OneToMany(
    (): typeof CrmObject => CrmObject,
    (object: CrmObject): Company => object.company,
  )
  objects?: CrmObject[];

  @ApiProperty({ required: false })
  @OneToMany(
    (): typeof CrmAssociationType => CrmAssociationType,
    (associationType: CrmAssociationType): Company => associationType.company,
  )
  associationTypes: CrmAssociationType[];

  @ApiProperty({ required: false })
  @OneToMany(
    (): typeof CrmObjectAssociation => CrmObjectAssociation,
    (objectAssociation: CrmObjectAssociation): Company =>
      objectAssociation.company,
  )
  objectAssociations?: CrmObjectAssociation[];

  // Automatically handles 'created at' timestamp
  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  // Automatically handles 'updated at' timestamp, updated whenever entity is modified
  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
