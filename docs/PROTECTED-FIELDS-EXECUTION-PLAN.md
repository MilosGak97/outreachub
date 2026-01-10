# Protected Field Types & Protected Values System

## Execution Plan for Implementation

> **Purpose:** Store sensitive contact data (phone numbers, emails, addresses) encrypted, expose only masked labels + actions to frontend. Users pay $400/month subscription - we want them to use our service, not export data.

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Architecture Overview](#architecture-overview)
3. [Execution Phases](#execution-phases)
4. [File Creation Order](#file-creation-order)
5. [Data Flow Diagrams](#data-flow-diagrams)
6. [Security Checklist](#security-checklist)
7. [Testing Strategy](#testing-strategy)

---

## Current State Analysis

### Already Implemented

| Component | File | Status |
|-----------|------|--------|
| Field Type Enum | `src/api/client/object-related/crm-object-field/field-types/field-type.enum.ts` | `PROTECTED_PHONE`, `PROTECTED_EMAIL`, `PROTECTED_ADDRESS` added |
| Field Metadata | `field-types/fields/protected-*-field.ts` | All 3 protected field definitions exist |
| Field Registry | `field-types/index.ts` | Protected types registered |
| ProtectedValue Entity | `src/api/entities/protected/protected-value.entity.ts` | Complete |
| ProtectedValueType Enum | `src/api/enums/protected/protected-value-type.enum.ts` | Complete |
| Base Repository | `src/api/repositories/postgres/protected/protected-value.repository.ts` | Basic CRUD only |
| Base Field Interface | `field-types/base-field.interface.ts` | `isProtected`, `storageType`, `protectedValueType` properties exist |

### Needs Implementation

| Component | Priority | Description |
|-----------|----------|-------------|
| Encryption Service | P0 | AES-256-GCM encrypt/decrypt |
| Masking Utilities | P0 | Generate masked display strings |
| Database Migration | P0 | `protected_values` table creation |
| Protected Field Transformer | P1 | Transform records for frontend response |
| Data Ingestion Integration | P1 | Encrypt & store on record create/update |
| Record Fetch Integration | P1 | Transform protected fields in GET responses |
| Action Execution Endpoints | P2 | Backend-only call/sms/email handlers |
| Module Wiring | P1 | NestJS providers, exports, DI |
| Environment Variables | P0 | Encryption key configuration |

---

## Architecture Overview

### How It Works

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PROTECTED VALUES FLOW                               │
│                                                                             │
│  1. DATA INGESTION                                                          │
│     Raw phone: "+1 240 483 9876"                                            │
│           ↓                                                                 │
│     Encrypt with AES-256-GCM                                                │
│           ↓                                                                 │
│     Store in protected_values table                                         │
│           ↓                                                                 │
│     Generate masked label: "+1 ****** 9876"                                 │
│                                                                             │
│  2. FRONTEND RESPONSE                                                       │
│     {                                                                       │
│       "type": "protected_phone",                                            │
│       "protected": true,                                                    │
│       "valueId": "uuid-here",          ← Reference only                     │
│       "display": "+1 ****** 9876",     ← Masked for display                 │
│       "actions": [                                                          │
│         { "type": "call", "enabled": true },                                │
│         { "type": "sms", "enabled": true }                                  │
│       ],                                                                    │
│       "revealable": false                                                   │
│     }                                                                       │
│                                                                             │
│  3. ACTION EXECUTION (Backend Only)                                         │
│     User clicks "Call" → Backend decrypts → Initiates call                  │
│     Real value NEVER sent to frontend                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/api/
├── common/
│   ├── encryption/
│   │   ├── encryption.service.ts          ← NEW
│   │   ├── encryption.module.ts           ← NEW
│   │   └── index.ts                       ← NEW
│   ├── masking/
│   │   ├── masking.utils.ts               ← NEW
│   │   └── index.ts                       ← NEW
│   └── protected/
│       └── protected.module.ts            ← NEW
│
├── entities/
│   └── protected/
│       ├── protected-value.entity.ts      ✓ EXISTS
│       └── index.ts                       ✓ EXISTS
│
├── enums/
│   └── protected/
│       └── protected-value-type.enum.ts   ✓ EXISTS
│
├── repositories/
│   └── postgres/
│       └── protected/
│           ├── protected-value.repository.ts  ← MODIFY (add methods)
│           └── index.ts                       ✓ EXISTS
│
├── client/
│   └── object-related/
│       ├── crm-object-field/
│       │   └── field-types/
│       │       ├── field-type.enum.ts         ✓ EXISTS (has protected types)
│       │       ├── base-field.interface.ts    ✓ EXISTS (has protected props)
│       │       ├── index.ts                   ✓ EXISTS (registered)
│       │       └── fields/
│       │           ├── protected-phone-field.ts    ✓ EXISTS
│       │           ├── protected-email-field.ts    ✓ EXISTS
│       │           └── protected-address-field.ts  ✓ EXISTS
│       │
│       └── crm-object/
│           ├── crm-object.service.ts              ← MODIFY
│           ├── crm-object.module.ts               ← MODIFY
│           ├── services/
│           │   ├── protected-field-transformer.service.ts  ← NEW
│           │   ├── protected-field-ingestion.service.ts    ← NEW
│           │   └── protected-action.service.ts             ← NEW
│           ├── controllers/
│           │   └── protected-actions.controller.ts         ← NEW
│           └── dto/
│               └── protected-field-response.dto.ts         ← NEW
│
└── database/
    └── migrations/
        └── YYYYMMDDHHMMSS-create-protected-values-table.ts  ← NEW
```

---

## Execution Phases

### Phase 1: Core Infrastructure (Encryption & Masking)

#### 1.1 Create Encryption Service

**File:** `src/api/common/encryption/encryption.service.ts`

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private key: Buffer;
  private readonly algorithm = 'aes-256-gcm';
  private readonly ivLength = 16;
  private readonly authTagLength = 16;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const keyBase64 = this.configService.get<string>('PROTECTED_VALUES_ENCRYPTION_KEY');
    if (!keyBase64) {
      throw new Error('PROTECTED_VALUES_ENCRYPTION_KEY environment variable is required');
    }

    this.key = Buffer.from(keyBase64, 'base64');
    if (this.key.length !== 32) {
      throw new Error('PROTECTED_VALUES_ENCRYPTION_KEY must be 32 bytes (256 bits) base64 encoded');
    }
  }

  /**
   * Encrypt plaintext to Buffer
   * Format: [IV (16 bytes)][AuthTag (16 bytes)][CipherText]
   */
  encrypt(plaintext: string): Buffer {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt Buffer to plaintext
   * Expects format: [IV (16 bytes)][AuthTag (16 bytes)][CipherText]
   */
  decrypt(encryptedData: Buffer): string {
    const iv = encryptedData.subarray(0, this.ivLength);
    const authTag = encryptedData.subarray(this.ivLength, this.ivLength + this.authTagLength);
    const ciphertext = encryptedData.subarray(this.ivLength + this.authTagLength);

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }
}
```

#### 1.2 Create Encryption Module

**File:** `src/api/common/encryption/encryption.module.ts`

```typescript
import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}
```

#### 1.3 Create Masking Utilities

**File:** `src/api/common/masking/masking.utils.ts`

```typescript
import { ProtectedValueType } from '../../enums/protected/protected-value-type.enum';

export type MaskingStyle = 'last4' | 'middle' | 'domain' | 'partial' | 'street_number';

/**
 * Mask phone number
 * Input: "+1 240 483 9876" → Output: "+1 ****** 9876"
 */
export function maskPhone(phone: string, style: MaskingStyle = 'last4'): string {
  // Remove all non-digit characters except leading +
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 4) {
    return '*'.repeat(phone.length);
  }

  if (style === 'last4') {
    const last4 = digits.slice(-4);
    const prefix = hasPlus ? '+' : '';
    const countryCode = digits.length > 10 ? digits.slice(0, digits.length - 10) : '';
    const maskedMiddle = '*'.repeat(Math.max(0, digits.length - 4 - countryCode.length));

    if (countryCode) {
      return `${prefix}${countryCode} ${maskedMiddle} ${last4}`;
    }
    return `${prefix}${maskedMiddle} ${last4}`;
  }

  // Default: mask middle portion
  const first2 = digits.slice(0, 2);
  const last2 = digits.slice(-2);
  const prefix = hasPlus ? '+' : '';
  return `${prefix}${first2}${'*'.repeat(digits.length - 4)}${last2}`;
}

/**
 * Mask email address
 * Input: "john.doe@example.com" → Output: "j***@e***.com"
 */
export function maskEmail(email: string, style: MaskingStyle = 'domain'): string {
  const atIndex = email.indexOf('@');
  if (atIndex === -1) {
    return '*'.repeat(email.length);
  }

  const localPart = email.slice(0, atIndex);
  const domainPart = email.slice(atIndex + 1);
  const dotIndex = domainPart.lastIndexOf('.');

  if (style === 'domain') {
    const maskedLocal = localPart.length > 0
      ? localPart[0] + '*'.repeat(Math.max(0, localPart.length - 1))
      : '*';

    if (dotIndex > 0) {
      const domainName = domainPart.slice(0, dotIndex);
      const tld = domainPart.slice(dotIndex);
      const maskedDomain = domainName.length > 0
        ? domainName[0] + '*'.repeat(Math.max(0, domainName.length - 1))
        : '*';
      return `${maskedLocal}@${maskedDomain}${tld}`;
    }

    return `${maskedLocal}@${'*'.repeat(domainPart.length)}`;
  }

  // Partial: show first and last character of local part
  const maskedLocal = localPart.length > 2
    ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
    : '*'.repeat(localPart.length);

  return `${maskedLocal}@${domainPart}`;
}

/**
 * Mask address
 * Input: "123 Main Street, Austin, TX 78701" → Output: "*** Main Street, Austin, TX 787**"
 */
export function maskAddress(address: string, style: MaskingStyle = 'street_number'): string {
  if (style === 'street_number') {
    // Mask street number at beginning
    let masked = address.replace(/^\d+/, (match) => '*'.repeat(match.length));

    // Mask last 2 digits of zip code if present
    masked = masked.replace(/(\d{3})(\d{2})$/, '$1**');

    return masked;
  }

  // Default: mask first word and partial zip
  const words = address.split(' ');
  if (words.length > 0) {
    words[0] = '*'.repeat(words[0].length);
  }
  return words.join(' ');
}

/**
 * Get the appropriate masking function for a value type
 */
export function getMasker(
  valueType: ProtectedValueType,
): (value: string, style?: MaskingStyle) => string {
  switch (valueType) {
    case ProtectedValueType.PHONE:
      return maskPhone;
    case ProtectedValueType.EMAIL:
      return maskEmail;
    case ProtectedValueType.ADDRESS:
      return maskAddress;
    default:
      return (value: string) => '*'.repeat(value.length);
  }
}

/**
 * Mask a value based on its type
 */
export function maskValue(
  value: string,
  valueType: ProtectedValueType,
  style?: MaskingStyle,
): string {
  const masker = getMasker(valueType);
  return masker(value, style);
}
```

#### 1.4 Create Index Exports

**File:** `src/api/common/encryption/index.ts`

```typescript
export * from './encryption.service';
export * from './encryption.module';
```

**File:** `src/api/common/masking/index.ts`

```typescript
export * from './masking.utils';
```

---

### Phase 2: Enhanced Repository Layer

#### 2.1 Update ProtectedValueRepository

**File:** `src/api/repositories/postgres/protected/protected-value.repository.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProtectedValue } from '../../../entities/protected/protected-value.entity';
import { ProtectedValueType } from '../../../enums/protected/protected-value-type.enum';
import { EncryptionService } from '../../../common/encryption';
import { maskValue, MaskingStyle } from '../../../common/masking';

export interface ProtectedValueInfo {
  id: string;
  valueType: ProtectedValueType;
  maskedLabel: string;
  metadata: Record<string, any> | null;
}

export interface CreateProtectedValueParams {
  companyId: string;
  valueType: ProtectedValueType;
  plainValue: string;
  maskingStyle?: MaskingStyle;
  sourceRecordId?: string | null;
  sourceFieldApiName?: string | null;
  sourceObjectTypeApiName?: string | null;
  metadata?: Record<string, any> | null;
}

@Injectable()
export class ProtectedValueRepository extends Repository<ProtectedValue> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly encryptionService: EncryptionService,
  ) {
    super(ProtectedValue, dataSource.createEntityManager());
  }

  /**
   * Create a new protected value with encryption
   */
  async createProtectedValue(
    params: CreateProtectedValueParams,
  ): Promise<{ id: string; maskedLabel: string }> {
    const {
      companyId,
      valueType,
      plainValue,
      maskingStyle,
      sourceRecordId,
      sourceFieldApiName,
      sourceObjectTypeApiName,
      metadata,
    } = params;

    const encryptedValue = this.encryptionService.encrypt(plainValue);
    const maskedLabel = maskValue(plainValue, valueType, maskingStyle);

    const value = this.create({
      companyId,
      valueType,
      encryptedValue,
      maskedLabel,
      sourceRecordId: sourceRecordId ?? null,
      sourceFieldApiName: sourceFieldApiName ?? null,
      sourceObjectTypeApiName: sourceObjectTypeApiName ?? null,
      metadata: metadata ?? null,
    });

    const saved = await this.save(value);
    return { id: saved.id, maskedLabel: saved.maskedLabel };
  }

  /**
   * Get protected value info for frontend (NO decryption)
   */
  async getProtectedValueInfo(
    id: string,
    companyId: string,
  ): Promise<ProtectedValueInfo | null> {
    const value = await this.findOne({
      where: { id, companyId },
      select: ['id', 'valueType', 'maskedLabel', 'metadata'],
    });

    if (!value) {
      return null;
    }

    return {
      id: value.id,
      valueType: value.valueType,
      maskedLabel: value.maskedLabel,
      metadata: value.metadata,
    };
  }

  /**
   * Get decrypted value - FOR INTERNAL ACTION EXECUTION ONLY
   * NEVER expose this to API responses
   */
  async getDecryptedValue(id: string, companyId: string): Promise<string | null> {
    const value = await this.findOne({
      where: { id, companyId },
      select: ['encryptedValue'],
    });

    if (!value) {
      return null;
    }

    return this.encryptionService.decrypt(value.encryptedValue);
  }

  /**
   * Bulk get protected values for a record
   */
  async getProtectedValuesForRecord(
    recordId: string,
    companyId: string,
  ): Promise<Map<string, ProtectedValueInfo>> {
    const values = await this.find({
      where: { sourceRecordId: recordId, companyId },
      select: ['id', 'valueType', 'maskedLabel', 'metadata', 'sourceFieldApiName'],
    });

    const map = new Map<string, ProtectedValueInfo>();
    for (const value of values) {
      if (value.sourceFieldApiName) {
        map.set(value.sourceFieldApiName, {
          id: value.id,
          valueType: value.valueType,
          maskedLabel: value.maskedLabel,
          metadata: value.metadata,
        });
      }
    }

    return map;
  }

  /**
   * Update a protected value (re-encrypt)
   */
  async updateProtectedValue(
    id: string,
    companyId: string,
    newPlainValue: string,
    maskingStyle?: MaskingStyle,
  ): Promise<{ maskedLabel: string }> {
    const value = await this.findOne({ where: { id, companyId } });

    if (!value) {
      throw new NotFoundException(`Protected value with id '${id}' not found`);
    }

    const encryptedValue = this.encryptionService.encrypt(newPlainValue);
    const maskedLabel = maskValue(newPlainValue, value.valueType, maskingStyle);

    await this.update(id, { encryptedValue, maskedLabel });

    return { maskedLabel };
  }

  /**
   * Delete all protected values for a record (cascade)
   */
  async deleteBySourceRecord(recordId: string, companyId: string): Promise<void> {
    await this.delete({ sourceRecordId: recordId, companyId });
  }

  /**
   * Delete by ID with company validation
   */
  async deleteByIdAndCompany(id: string, companyId: string): Promise<boolean> {
    const result = await this.delete({ id, companyId });
    return (result.affected ?? 0) > 0;
  }
}
```

---

### Phase 3: Database Migration

#### 3.1 Create Migration File

**File:** `src/api/database/migrations/YYYYMMDDHHMMSS-create-protected-values-table.ts`

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProtectedValuesTable1234567890123 implements MigrationInterface {
  name = 'CreateProtectedValuesTable1234567890123';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "ProtectedValueType" AS ENUM ('phone', 'email', 'address');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Create table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "protected_values" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID NOT NULL,
        "value_type" "ProtectedValueType" NOT NULL,
        "encrypted_value" BYTEA NOT NULL,
        "masked_label" VARCHAR(255) NOT NULL,
        "source_record_id" UUID,
        "source_field_api_name" VARCHAR(100),
        "source_object_type_api_name" VARCHAR(100),
        "metadata" JSONB,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_protected_values_company_record"
      ON "protected_values"("company_id", "source_record_id")
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_protected_values_company_type"
      ON "protected_values"("company_id", "value_type")
    `);

    // Foreign key to companies table
    await queryRunner.query(`
      ALTER TABLE "protected_values"
      ADD CONSTRAINT "fk_protected_values_company"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "protected_values" DROP CONSTRAINT IF EXISTS "fk_protected_values_company"
    `);

    await queryRunner.query(`DROP INDEX IF EXISTS "idx_protected_values_company_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_protected_values_company_record"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "protected_values"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ProtectedValueType"`);
  }
}
```

---

### Phase 4: Record Response Transformation

#### 4.1 Create Response DTOs

**File:** `src/api/client/object-related/crm-object/dto/protected-field-response.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';

export class ProtectedFieldActionDto {
  @ApiProperty({ example: 'call', description: 'Action type: call, sms, email, postcard, directions' })
  type: string;

  @ApiProperty({ example: true, description: 'Whether this action is currently enabled' })
  enabled: boolean;
}

export class ProtectedFieldValueDto {
  @ApiProperty({ example: 'protected_phone', description: 'The protected field type' })
  type: string;

  @ApiProperty({ example: true, description: 'Always true for protected fields' })
  protected: true;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000', description: 'Reference to protected value' })
  valueId: string;

  @ApiProperty({ example: '+1 ****** 9876', description: 'Masked display value' })
  display: string;

  @ApiProperty({ type: [ProtectedFieldActionDto], description: 'Available actions for this field' })
  actions: ProtectedFieldActionDto[];

  @ApiProperty({ example: false, description: 'Whether this value can be revealed (always false)' })
  revealable: false;
}
```

#### 4.2 Create Protected Field Transformer Service

**File:** `src/api/client/object-related/crm-object/services/protected-field-transformer.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ProtectedValueRepository, ProtectedValueInfo } from '../../../../repositories/postgres/protected/protected-value.repository';
import { CrmObject } from '../../../../entities/object/crm-object.entity';
import { CrmObjectField } from '../../../../entities/object/crm-object-field.entity';
import { FieldType } from '../../crm-object-field/field-types/field-type.enum';
import { FieldRegistry } from '../../crm-object-field/field-types';
import { ProtectedFieldValueDto, ProtectedFieldActionDto } from '../dto/protected-field-response.dto';

const PROTECTED_FIELD_TYPES = new Set([
  FieldType.PROTECTED_PHONE,
  FieldType.PROTECTED_EMAIL,
  FieldType.PROTECTED_ADDRESS,
]);

export interface TransformedFieldValues {
  [apiName: string]: any | ProtectedFieldValueDto;
}

@Injectable()
export class ProtectedFieldTransformerService {
  constructor(
    private readonly protectedValueRepo: ProtectedValueRepository,
  ) {}

  /**
   * Check if a field type is protected
   */
  isProtectedFieldType(fieldType: FieldType): boolean {
    return PROTECTED_FIELD_TYPES.has(fieldType);
  }

  /**
   * Get protected field definitions from a list of field definitions
   */
  getProtectedFieldDefinitions(fieldDefinitions: CrmObjectField[]): CrmObjectField[] {
    return fieldDefinitions.filter((field) =>
      this.isProtectedFieldType(field.fieldType as FieldType),
    );
  }

  /**
   * Build actions array for a protected field type
   */
  private buildActionsForFieldType(fieldType: FieldType): ProtectedFieldActionDto[] {
    const metadata = FieldRegistry[fieldType];
    if (!metadata?.actions) {
      return [];
    }

    return metadata.actions.map((action) => ({
      type: action.toLowerCase(),
      enabled: true,
    }));
  }

  /**
   * Transform a protected field value for frontend response
   */
  private transformProtectedValue(
    fieldType: FieldType,
    protectedInfo: ProtectedValueInfo,
  ): ProtectedFieldValueDto {
    return {
      type: fieldType,
      protected: true,
      valueId: protectedInfo.id,
      display: protectedInfo.maskedLabel,
      actions: this.buildActionsForFieldType(fieldType),
      revealable: false,
    };
  }

  /**
   * Transform a single record's field values for frontend response
   */
  async transformRecordForResponse(params: {
    record: CrmObject;
    fieldDefinitions: CrmObjectField[];
    companyId: string;
  }): Promise<TransformedFieldValues> {
    const { record, fieldDefinitions, companyId } = params;

    const protectedFields = this.getProtectedFieldDefinitions(fieldDefinitions);

    if (protectedFields.length === 0) {
      return { ...record.fieldValues };
    }

    // Get all protected values for this record in one query
    const protectedValuesMap = await this.protectedValueRepo.getProtectedValuesForRecord(
      record.id,
      companyId,
    );

    const transformedValues: TransformedFieldValues = { ...record.fieldValues };

    for (const field of protectedFields) {
      const currentValue = record.fieldValues[field.apiName];

      // Check if this field has a protected value reference
      if (
        currentValue &&
        typeof currentValue === 'object' &&
        'protectedValueId' in currentValue
      ) {
        const protectedValueId = (currentValue as { protectedValueId: string }).protectedValueId;

        // Try to get from map first (by field apiName)
        let protectedInfo = protectedValuesMap.get(field.apiName);

        // If not in map, fetch individually
        if (!protectedInfo) {
          protectedInfo = await this.protectedValueRepo.getProtectedValueInfo(
            protectedValueId,
            companyId,
          ) ?? undefined;
        }

        if (protectedInfo) {
          transformedValues[field.apiName] = this.transformProtectedValue(
            field.fieldType as FieldType,
            protectedInfo,
          );
        } else {
          // Protected value not found - return null
          transformedValues[field.apiName] = null;
        }
      }
    }

    return transformedValues;
  }

  /**
   * Bulk transform records for list endpoints
   */
  async transformRecordsForResponse(params: {
    records: CrmObject[];
    fieldDefinitions: CrmObjectField[];
    companyId: string;
  }): Promise<Array<CrmObject & { fieldValues: TransformedFieldValues }>> {
    const { records, fieldDefinitions, companyId } = params;

    const results = await Promise.all(
      records.map(async (record) => {
        const transformedFieldValues = await this.transformRecordForResponse({
          record,
          fieldDefinitions,
          companyId,
        });

        return {
          ...record,
          fieldValues: transformedFieldValues,
        };
      }),
    );

    return results;
  }
}
```

---

### Phase 5: Data Ingestion Integration

#### 5.1 Create Protected Field Ingestion Service

**File:** `src/api/client/object-related/crm-object/services/protected-field-ingestion.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { ProtectedValueRepository } from '../../../../repositories/postgres/protected/protected-value.repository';
import { CrmObjectField } from '../../../../entities/object/crm-object-field.entity';
import { FieldType } from '../../crm-object-field/field-types/field-type.enum';
import { ProtectedValueType } from '../../../../enums/protected/protected-value-type.enum';
import { FieldValue } from '../../../../interfaces/object-field-values.interface';
import { MaskingStyle } from '../../../../common/masking';

const FIELD_TYPE_TO_PROTECTED_TYPE: Record<string, ProtectedValueType> = {
  [FieldType.PROTECTED_PHONE]: ProtectedValueType.PHONE,
  [FieldType.PROTECTED_EMAIL]: ProtectedValueType.EMAIL,
  [FieldType.PROTECTED_ADDRESS]: ProtectedValueType.ADDRESS,
};

const PROTECTED_FIELD_TYPES = new Set(Object.keys(FIELD_TYPE_TO_PROTECTED_TYPE));

export interface ProcessedFieldValues {
  processedFieldValues: Record<string, FieldValue>;
  createdProtectedValueIds: string[];
}

@Injectable()
export class ProtectedFieldIngestionService {
  constructor(
    private readonly protectedValueRepo: ProtectedValueRepository,
  ) {}

  /**
   * Check if a field type is protected
   */
  isProtectedFieldType(fieldType: string): boolean {
    return PROTECTED_FIELD_TYPES.has(fieldType);
  }

  /**
   * Get protected value type from field type
   */
  getProtectedValueType(fieldType: string): ProtectedValueType | null {
    return FIELD_TYPE_TO_PROTECTED_TYPE[fieldType] ?? null;
  }

  /**
   * Process incoming field values, encrypting protected ones
   */
  async processFieldValues(params: {
    companyId: string;
    recordId: string | null;
    objectTypeApiName: string;
    fieldValues: Record<string, any>;
    fieldDefinitions: CrmObjectField[];
  }): Promise<ProcessedFieldValues> {
    const {
      companyId,
      recordId,
      objectTypeApiName,
      fieldValues,
      fieldDefinitions,
    } = params;

    const processedFieldValues: Record<string, FieldValue> = {};
    const createdProtectedValueIds: string[] = [];

    // Create a map of field apiName to definition for quick lookup
    const fieldDefMap = new Map(
      fieldDefinitions.map((def) => [def.apiName, def]),
    );

    for (const [apiName, value] of Object.entries(fieldValues)) {
      const fieldDef = fieldDefMap.get(apiName);

      // If no definition found or not a protected type, pass through
      if (!fieldDef || !this.isProtectedFieldType(fieldDef.fieldType)) {
        processedFieldValues[apiName] = value;
        continue;
      }

      // Handle null/undefined values
      if (value === null || value === undefined) {
        processedFieldValues[apiName] = null;
        continue;
      }

      // If value is already a protected reference, keep it
      if (
        typeof value === 'object' &&
        value !== null &&
        'protectedValueId' in value
      ) {
        processedFieldValues[apiName] = value;
        continue;
      }

      // Value is a raw string - encrypt and store
      if (typeof value === 'string') {
        const protectedValueType = this.getProtectedValueType(fieldDef.fieldType);
        if (!protectedValueType) {
          processedFieldValues[apiName] = value;
          continue;
        }

        // Get masking style from field config if available
        const maskingStyle = (fieldDef.configShape as any)?.maskingStyle as MaskingStyle | undefined;

        const { id: protectedValueId } = await this.protectedValueRepo.createProtectedValue({
          companyId,
          valueType: protectedValueType,
          plainValue: value,
          maskingStyle,
          sourceRecordId: recordId,
          sourceFieldApiName: apiName,
          sourceObjectTypeApiName: objectTypeApiName,
        });

        createdProtectedValueIds.push(protectedValueId);
        processedFieldValues[apiName] = { protectedValueId };
      } else {
        // Unknown value type, pass through
        processedFieldValues[apiName] = value;
      }
    }

    return { processedFieldValues, createdProtectedValueIds };
  }

  /**
   * Update a protected field value
   */
  async updateProtectedFieldValue(params: {
    companyId: string;
    existingProtectedValueId: string;
    newPlainValue: string;
    maskingStyle?: MaskingStyle;
  }): Promise<{ maskedLabel: string }> {
    return this.protectedValueRepo.updateProtectedValue(
      params.existingProtectedValueId,
      params.companyId,
      params.newPlainValue,
      params.maskingStyle,
    );
  }

  /**
   * Delete protected values when a record is deleted
   */
  async deleteProtectedValuesForRecord(
    recordId: string,
    companyId: string,
  ): Promise<void> {
    await this.protectedValueRepo.deleteBySourceRecord(recordId, companyId);
  }
}
```

---

### Phase 6: Action Execution (Backend-Only Operations)

#### 6.1 Create Protected Action Service

**File:** `src/api/client/object-related/crm-object/services/protected-action.service.ts`

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProtectedValueRepository } from '../../../../repositories/postgres/protected/protected-value.repository';
import { ProtectedValueType } from '../../../../enums/protected/protected-value-type.enum';

// These would be injected from actual service integrations
// import { TwilioService } from '../../../../integrations/twilio/twilio.service';
// import { SendGridService } from '../../../../integrations/sendgrid/sendgrid.service';

export interface CallResult {
  callSid: string;
  status: string;
}

export interface SmsResult {
  messageSid: string;
  status: string;
}

export interface EmailResult {
  messageId: string;
  status: string;
}

@Injectable()
export class ProtectedActionService {
  constructor(
    private readonly protectedValueRepo: ProtectedValueRepository,
    // private readonly twilioService: TwilioService,
    // private readonly sendGridService: SendGridService,
  ) {}

  /**
   * Get decrypted value for action execution (private)
   * NEVER expose this value in any response
   */
  private async getDecryptedValueForAction(
    protectedValueId: string,
    companyId: string,
    expectedType: ProtectedValueType,
  ): Promise<string> {
    const info = await this.protectedValueRepo.getProtectedValueInfo(
      protectedValueId,
      companyId,
    );

    if (!info) {
      throw new NotFoundException('Protected value not found');
    }

    if (info.valueType !== expectedType) {
      throw new ForbiddenException(
        `Invalid action for value type. Expected ${expectedType}, got ${info.valueType}`,
      );
    }

    const decrypted = await this.protectedValueRepo.getDecryptedValue(
      protectedValueId,
      companyId,
    );

    if (!decrypted) {
      throw new NotFoundException('Protected value not found');
    }

    return decrypted;
  }

  /**
   * Initiate a phone call
   */
  async initiateCall(params: {
    protectedValueId: string;
    companyId: string;
    fromNumber: string;
    userId: string;
  }): Promise<CallResult> {
    const phoneNumber = await this.getDecryptedValueForAction(
      params.protectedValueId,
      params.companyId,
      ProtectedValueType.PHONE,
    );

    // TODO: Integrate with Twilio
    // const call = await this.twilioService.initiateCall({
    //   to: phoneNumber,
    //   from: params.fromNumber,
    //   userId: params.userId,
    // });

    // Placeholder response
    return {
      callSid: `CALL_${Date.now()}`,
      status: 'initiated',
    };
  }

  /**
   * Send an SMS
   */
  async sendSms(params: {
    protectedValueId: string;
    companyId: string;
    message: string;
    fromNumber: string;
    userId: string;
  }): Promise<SmsResult> {
    const phoneNumber = await this.getDecryptedValueForAction(
      params.protectedValueId,
      params.companyId,
      ProtectedValueType.PHONE,
    );

    // TODO: Integrate with Twilio
    // const sms = await this.twilioService.sendSms({
    //   to: phoneNumber,
    //   from: params.fromNumber,
    //   body: params.message,
    //   userId: params.userId,
    // });

    // Placeholder response
    return {
      messageSid: `SMS_${Date.now()}`,
      status: 'sent',
    };
  }

  /**
   * Send an email
   */
  async sendEmail(params: {
    protectedValueId: string;
    companyId: string;
    subject: string;
    body: string;
    fromAddress: string;
    userId: string;
  }): Promise<EmailResult> {
    const emailAddress = await this.getDecryptedValueForAction(
      params.protectedValueId,
      params.companyId,
      ProtectedValueType.EMAIL,
    );

    // TODO: Integrate with SendGrid
    // const email = await this.sendGridService.sendEmail({
    //   to: emailAddress,
    //   from: params.fromAddress,
    //   subject: params.subject,
    //   html: params.body,
    //   userId: params.userId,
    // });

    // Placeholder response
    return {
      messageId: `EMAIL_${Date.now()}`,
      status: 'sent',
    };
  }
}
```

#### 6.2 Create Actions Controller

**File:** `src/api/client/object-related/crm-object/controllers/protected-actions.controller.ts`

```typescript
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../client/auth/guards/jwt-auth.guard';
import { ProtectedActionService, CallResult, SmsResult, EmailResult } from '../services/protected-action.service';
import { IsString, IsUUID, IsNotEmpty, MaxLength } from 'class-validator';

class InitiateCallDto {
  @IsUUID()
  protectedValueId: string;

  @IsString()
  @IsNotEmpty()
  fromNumber: string;
}

class SendSmsDto {
  @IsUUID()
  protectedValueId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1600)
  message: string;

  @IsString()
  @IsNotEmpty()
  fromNumber: string;
}

class SendEmailDto {
  @IsUUID()
  protectedValueId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsNotEmpty()
  fromAddress: string;
}

@ApiTags('Protected Actions')
@ApiBearerAuth()
@Controller('client/protected-actions')
@UseGuards(JwtAuthGuard)
export class ProtectedActionsController {
  constructor(private readonly protectedActionService: ProtectedActionService) {}

  @Post('call')
  @ApiOperation({ summary: 'Initiate a phone call to a protected phone number' })
  async initiateCall(
    @Body() dto: InitiateCallDto,
    @Request() req: any,
  ): Promise<CallResult> {
    return this.protectedActionService.initiateCall({
      protectedValueId: dto.protectedValueId,
      companyId: req.user.companyId,
      fromNumber: dto.fromNumber,
      userId: req.user.id,
    });
  }

  @Post('sms')
  @ApiOperation({ summary: 'Send an SMS to a protected phone number' })
  async sendSms(
    @Body() dto: SendSmsDto,
    @Request() req: any,
  ): Promise<SmsResult> {
    return this.protectedActionService.sendSms({
      protectedValueId: dto.protectedValueId,
      companyId: req.user.companyId,
      message: dto.message,
      fromNumber: dto.fromNumber,
      userId: req.user.id,
    });
  }

  @Post('email')
  @ApiOperation({ summary: 'Send an email to a protected email address' })
  async sendEmail(
    @Body() dto: SendEmailDto,
    @Request() req: any,
  ): Promise<EmailResult> {
    return this.protectedActionService.sendEmail({
      protectedValueId: dto.protectedValueId,
      companyId: req.user.companyId,
      subject: dto.subject,
      body: dto.body,
      fromAddress: dto.fromAddress,
      userId: req.user.id,
    });
  }
}
```

---

### Phase 7: Module Integration

#### 7.1 Create Protected Module

**File:** `src/api/common/protected/protected.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProtectedValue } from '../../entities/protected/protected-value.entity';
import { ProtectedValueRepository } from '../../repositories/postgres/protected/protected-value.repository';
import { EncryptionModule } from '../encryption/encryption.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProtectedValue]),
    EncryptionModule,
  ],
  providers: [ProtectedValueRepository],
  exports: [ProtectedValueRepository],
})
export class ProtectedModule {}
```

#### 7.2 Update CrmObject Module

**File:** `src/api/client/object-related/crm-object/crm-object.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrmObject } from '../../../entities/object/crm-object.entity';
import { CrmObjectService } from './crm-object.service';
import { CrmObjectController } from './crm-object.controller';
import { CrmObjectRepository } from '../../../repositories/postgres/object/crm-object.repository';
import { ProtectedModule } from '../../../common/protected/protected.module';
import { ProtectedFieldTransformerService } from './services/protected-field-transformer.service';
import { ProtectedFieldIngestionService } from './services/protected-field-ingestion.service';
import { ProtectedActionService } from './services/protected-action.service';
import { ProtectedActionsController } from './controllers/protected-actions.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([CrmObject]),
    ProtectedModule,
  ],
  controllers: [
    CrmObjectController,
    ProtectedActionsController,
  ],
  providers: [
    CrmObjectService,
    CrmObjectRepository,
    ProtectedFieldTransformerService,
    ProtectedFieldIngestionService,
    ProtectedActionService,
  ],
  exports: [CrmObjectService],
})
export class CrmObjectModule {}
```

---

### Phase 8: Environment Configuration

#### 8.1 Add Environment Variable

**File:** `.env`

```bash
# Protected Values Encryption Key
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# IMPORTANT: Store this securely, loss of key = loss of all protected data
PROTECTED_VALUES_ENCRYPTION_KEY=your-base64-encoded-32-byte-key-here
```

#### 8.2 Add to Config Validation (example)

**File:** `src/config/env.validation.ts`

```typescript
import { plainToInstance } from 'class-transformer';
import { IsString, IsNotEmpty, validateSync, IsBase64 } from 'class-validator';

class EnvironmentVariables {
  // ... other env vars

  @IsString()
  @IsNotEmpty()
  @IsBase64()
  PROTECTED_VALUES_ENCRYPTION_KEY: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
```

---

## File Creation Order

| Order | File | Dependencies | Effort |
|-------|------|--------------|--------|
| 1 | `common/encryption/encryption.service.ts` | None | Small |
| 2 | `common/encryption/encryption.module.ts` | 1 | Small |
| 3 | `common/encryption/index.ts` | 1, 2 | Small |
| 4 | `common/masking/masking.utils.ts` | None | Small |
| 5 | `common/masking/index.ts` | 4 | Small |
| 6 | Migration file | None | Small |
| 7 | Update `protected-value.repository.ts` | 1, 4 | Medium |
| 8 | `crm-object/dto/protected-field-response.dto.ts` | None | Small |
| 9 | `crm-object/services/protected-field-transformer.service.ts` | 7, 8 | Medium |
| 10 | `crm-object/services/protected-field-ingestion.service.ts` | 7 | Medium |
| 11 | `crm-object/services/protected-action.service.ts` | 7 | Medium |
| 12 | `crm-object/controllers/protected-actions.controller.ts` | 11 | Small |
| 13 | `common/protected/protected.module.ts` | 7 | Small |
| 14 | Update `crm-object.module.ts` | 9, 10, 11, 12, 13 | Small |
| 15 | Update `crm-object.service.ts` | 9, 10 | Medium |
| 16 | Environment config | None | Small |

---

## Data Flow Diagrams

### Ingestion Flow (Create/Update Record)

```
Frontend POST /records
{ fieldValues: { _name: "John", _phone: "+1 240 483 9876" } }
    │
    ▼
┌─────────────────────────────────────────┐
│   CrmObjectService.create()             │
│   - Receives raw field values           │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  ProtectedFieldIngestionService         │
│  processFieldValues()                   │
│                                         │
│  For each field:                        │
│  ├─ _name: "John"                       │
│  │   → Not protected → pass through     │
│  │                                      │
│  └─ _phone: "+1 240 483 9876"           │
│      → Is PROTECTED_PHONE               │
│      → Encrypt with AES-256-GCM         │
│      → Store in protected_values table  │
│      → Return { protectedValueId: "x" } │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  Save CrmObject with:                   │
│  fieldValues: {                         │
│    _name: "John",                       │
│    _phone: {                            │
│      protectedValueId: "uuid-xxx"       │  ← Only reference stored
│    }                                    │
│  }                                      │
└─────────────────────────────────────────┘
```

### Response Flow (GET Record)

```
Frontend GET /records/:id
    │
    ▼
┌─────────────────────────────────────────┐
│   CrmObjectService.findById()           │
│   - Fetches raw record from DB          │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  ProtectedFieldTransformerService       │
│  transformRecordForResponse()           │
│                                         │
│  For each field:                        │
│  ├─ _name: "John"                       │
│  │   → Not protected → pass through     │
│  │                                      │
│  └─ _phone: { protectedValueId: "x" }   │
│      → Is PROTECTED_PHONE               │
│      → Fetch from protected_values      │
│      → Get maskedLabel (NO decrypt!)    │
│      → Build response shape:            │
│        {                                │
│          type: "protected_phone",       │
│          protected: true,               │
│          valueId: "uuid-xxx",           │
│          display: "+1 ****** 9876",     │
│          actions: [{ type: "call" }],   │
│          revealable: false              │
│        }                                │
└─────────────────────────────────────────┘
    │
    ▼
Frontend receives:
{
  id: "record-uuid",
  fieldValues: {
    _name: "John",
    _phone: {
      type: "protected_phone",
      protected: true,
      valueId: "uuid-xxx",
      display: "+1 ****** 9876",
      actions: [{ type: "call", enabled: true }],
      revealable: false
    }
  }
}

✓ Real phone number NEVER leaves backend
```

### Action Flow (Call/SMS/Email)

```
Frontend: User clicks "Call" button
    │
    ▼
POST /client/protected-actions/call
{ protectedValueId: "uuid-xxx", fromNumber: "+1 555 123 4567" }
    │
    ▼
┌─────────────────────────────────────────┐
│  ProtectedActionsController.call()      │
│  - Extracts companyId from JWT          │
│  - Validates request                    │
└─────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────┐
│  ProtectedActionService.initiateCall()  │
│                                         │
│  1. Validate companyId owns this value  │
│  2. Decrypt value (internal only)       │
│     → "+1 240 483 9876"                 │
│  3. Call Twilio API with real number    │
│  4. Return call status (no number!)     │
│                                         │
│  ✓ Decrypted number NEVER in response   │
│  ✓ Decrypted number NEVER logged        │
└─────────────────────────────────────────┘
    │
    ▼
Frontend receives:
{ callSid: "CA123...", status: "initiated" }

✓ User can make calls without seeing number
✓ Number stays protected in our system
```

---

## Security Checklist

| Rule | Implementation | File |
|------|----------------|------|
| Never return decrypted values to frontend | Transformer only returns `maskedLabel`, `valueId` | `protected-field-transformer.service.ts` |
| Never log decrypted values | No console.log in decrypt path | `encryption.service.ts` |
| Only decrypt for action execution | `getDecryptedValue` is private method | `protected-action.service.ts` |
| Validate companyId before any operation | All repo methods require `companyId` | `protected-value.repository.ts` |
| Key rotation support | Re-encryption migration pattern | Future migration |
| Startup validation | EncryptionService throws if key missing | `encryption.service.ts` |
| Authenticated encryption | AES-256-GCM with auth tag | `encryption.service.ts` |
| Secure key storage | Environment variable, not in code | `.env` |

---

## Testing Strategy

### Unit Tests

```typescript
// encryption.service.spec.ts
describe('EncryptionService', () => {
  it('should encrypt and decrypt roundtrip correctly');
  it('should throw on missing encryption key');
  it('should throw on invalid key length');
  it('should produce different ciphertext for same plaintext (IV randomness)');
  it('should fail decryption with tampered ciphertext');
  it('should fail decryption with tampered auth tag');
});

// masking.utils.spec.ts
describe('Masking Utils', () => {
  describe('maskPhone', () => {
    it('should mask phone with last4 style');
    it('should handle international format');
    it('should handle short numbers');
  });

  describe('maskEmail', () => {
    it('should mask email with domain style');
    it('should handle short local parts');
    it('should handle emails without TLD');
  });

  describe('maskAddress', () => {
    it('should mask street number');
    it('should mask zip code last digits');
  });
});

// protected-value.repository.spec.ts
describe('ProtectedValueRepository', () => {
  it('should create protected value with encryption');
  it('should return masked info without decryption');
  it('should decrypt value for authorized company');
  it('should return null for wrong company');
  it('should bulk fetch values for record');
  it('should cascade delete on record deletion');
});
```

### Integration Tests

```typescript
describe('Protected Fields Integration', () => {
  it('should encrypt phone on record creation');
  it('should return masked phone on record fetch');
  it('should never return raw phone value');
  it('should execute call action with decrypted number');
  it('should reject cross-company access');
  it('should delete protected values when record deleted');
});
```

### E2E Tests

```typescript
describe('Protected Fields E2E', () => {
  it('full flow: create contact with protected phone → fetch → call');
  it('bulk import with protected fields');
  it('update protected field value');
  it('unauthorized access returns 404');
});
```

---

## Notes & Decisions

| Decision | Reasoning |
|----------|-----------|
| Separate `protected_values` table | Easier to audit, encrypt, manage access; clear separation of concerns |
| AES-256-GCM | Authenticated encryption prevents tampering; industry standard |
| Store masked label | Avoid re-computing on every read; masked format is deterministic anyway |
| Link to source record | Enable bulk fetch for record display; cascade delete |
| Actions array in response | Frontend knows what buttons to show without hardcoding |
| `revealable: false` always | Per requirements: no pay-per-reveal, no free reveals |
| Company isolation | All queries require `companyId` to prevent data leakage |

---

## Future Enhancements

1. **Key Rotation**: Migration to re-encrypt all values with new key
2. **Audit Logging**: Track who accessed/decrypted what and when
3. **Rate Limiting**: Limit action executions per user/company
4. **Action Logging**: Store history of calls/sms/emails sent
5. **Bulk Actions**: Send SMS to multiple protected numbers at once
6. **Postcard Integration**: Physical mail for protected addresses
