import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import {
  ProtectedValueType,
  ProtectedValueTypeEnumName,
} from '../../enums/protected/protected-value-type.enum';

@Entity('protected_values')
@Index(['companyId', 'sourceRecordId'])
@Index(['companyId', 'valueType'])
export class ProtectedValue {
  @ApiProperty({ description: 'Primary key of the protected value', example: 'd89f1a...' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Owning company identifier', example: '36a...' })
  @Column({ type: 'uuid' })
  companyId: string;

  @ApiProperty({ enum: ProtectedValueType, enumName: ProtectedValueTypeEnumName })
  @Column({ type: 'enum', enum: ProtectedValueType, enumName: ProtectedValueTypeEnumName })
  valueType: ProtectedValueType;

  @ApiProperty({ description: 'AES-256-GCM encrypted payload stored as bytea' })
  @Column({ type: 'bytea' })
  encryptedValue: Buffer;

  @ApiProperty({ description: 'Masked label shown to the UI', example: '+1 ****** 9876' })
  @Column({ type: 'varchar', length: 255 })
  maskedLabel: string;

  @ApiProperty({ description: 'Associated CRM record (optional)', required: false })
  @Column({ type: 'uuid', nullable: true })
  sourceRecordId: string | null;

  @ApiProperty({ description: 'Field apiName that owns the value', required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  sourceFieldApiName: string | null;

  @ApiProperty({ description: 'Object type apiName that owns the value', required: false })
  @Column({ type: 'varchar', length: 100, nullable: true })
  sourceObjectTypeApiName: string | null;

  @ApiProperty({ description: 'Optional metadata for adapters', required: false })
  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any> | null;

  @ApiProperty({ description: 'Record creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Record update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}
