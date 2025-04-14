import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsPhoneNumber,
  IsEnum,
  IsBoolean,
  IsNotEmpty,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AdminStatus } from '../enums/admin-status.enum';
import { AdminRole } from '../enums/admin-role.enum';
import { UserType } from '../enums/user-type.enum';
import { PhoneNumberTypeDto } from '../common/dto/phone-number-type.dto';

@Entity('admins')
export class Admin {
  @ApiProperty({
    description: 'Unique identifier of the Admin User',
    example: 'd5b9f1a3-4c9b-4c9a-9250-3a5ecedc4b9f',
    required: true,
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsString()
  @Column()
  name: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsEmail()
  @Column()
  email: string;

  @ApiProperty({ required: true })
  @IsNotEmpty()
  @IsBoolean()
  @Column({ name: 'email_verified', default: false }) // Default value for email_verified
  emailVerified: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Column()
  password: string;

// Store the phone object as JSON
  @ApiProperty({ required: false })
  @Column({ name: 'phone_number', type: 'json', nullable: true })
  phoneNumber?: PhoneNumberTypeDto

  @ApiProperty({
    enum: AdminRole,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(AdminRole)
  @Column()
  role: AdminRole;

  @ApiProperty()
  @IsEnum(UserType)
  @Column({ name: 'user_type', nullable: true })
  userType?: UserType.EMPLOYEE;

  @ApiProperty({ required: false })
  @IsNotEmpty()
  @IsString()
  @Column({ name: 'created_by', nullable: true })
  createdBy?: string;

  @ApiProperty({
    description: 'The ENUM status of the Admin User ',
    enum: AdminStatus,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(AdminStatus)
  @Column()
  status: AdminStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Column({ name: 'refresh_token', nullable: true })
  refreshToken?: string;

  @ApiProperty({ required: true })
  @IsBoolean()
  @Column({ name: 'initial_password' })
  initialPassword: boolean;

  @ApiProperty({ required: true })
  @IsDate()
  @Column({ name: 'status_changed_at' })
  statusChangedAt: Date;

  // Automatically handles 'created at' timestamp
  @ApiProperty()
  @CreateDateColumn()
  created_at: Date;

  // Automatically handles 'updated at' timestamp, updated whenever entity is modified
  @ApiProperty()
  @UpdateDateColumn()
  updated_at: Date;
}
