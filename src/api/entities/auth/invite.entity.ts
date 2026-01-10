import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Company } from '../company.entity';
import { User } from '../user.entity';
import { InviteStatus, InviteStatusEnumName } from '../../enums/auth2/invite-status.enum';
import { UserRole } from '../../enums/user/user-role.enum';

@Entity('invites')
@Index(['companyId', 'status'])
@Index(['email', 'companyId'])
@Index(['token'], { unique: true })
export class Invite {
  @ApiProperty({ description: 'Unique identifier for the invite' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Email address of the invited user' })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @ApiProperty({ description: 'Secure token for accepting the invite' })
  @Column({ type: 'varchar', length: 500 })
  token: string;

  @ApiProperty({ description: 'Role to assign to the user upon acceptance', enum: UserRole })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.SALES })
  role: UserRole;

  @ApiProperty({ description: 'Current status of the invite', enum: InviteStatus })
  @Column({ type: 'enum', enum: InviteStatus, enumName: InviteStatusEnumName, default: InviteStatus.PENDING })
  status: InviteStatus;

  @ApiProperty({ description: 'Company the user is being invited to' })
  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  company: Company;

  @Column({ type: 'uuid' })
  companyId: string;

  @ApiProperty({ description: 'User who sent the invite' })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  invitedBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  invitedById: string | null;

  @ApiProperty({ description: 'User who accepted the invite (set after acceptance)' })
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  acceptedBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  acceptedById: string | null;

  @ApiProperty({ description: 'When the invite expires' })
  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @ApiProperty({ description: 'When the invite was accepted' })
  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt: Date | null;

  @ApiProperty({ description: 'When the invite was created' })
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ApiProperty({ description: 'When the invite was last updated' })
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
