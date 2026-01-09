CODEX IMPLEMENTATION INSTRUCTIONS

Protected Field Types & Protected Values System

  ---
PHASE 1: Database & Entity Layer

Task 1.1: Create Protected Value Entity

File: src/api/entities/protected/protected-value.entity.ts
** THIS SHOULD BE src/api/entities/templates

/**
* Entity to store protected/sensitive values (phone numbers, emails, addresses)
* that should never be exposed to the frontend.
*
* Key points:
* - Values are encrypted at rest using AES-256
* - Only valueId + maskedLabel are sent to frontend
* - Real values are only accessed when executing actions
    */

import {
Entity,
PrimaryGeneratedColumn,
Column,
CreateDateColumn,
UpdateDateColumn,
Index,
ManyToOne,
JoinColumn,
} from 'typeorm';
import { Company } from '../company.entity';

export enum ProtectedValueType {
PHONE = 'phone',
EMAIL = 'email',
ADDRESS = 'address',
}

@Entity('protected_values')
@Index(['companyId', 'sourceRecordId'])
@Index(['companyId', 'valueType'])
export class ProtectedValue {
@PrimaryGeneratedColumn('uuid')
id: string;

    @Column({ type: 'uuid' })
    companyId: string;

    @ManyToOne(() => Company, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'companyId' })
    company: Company;

    @Column({
      type: 'enum',
      enum: ProtectedValueType,
    })
    valueType: ProtectedValueType;

    @Column({ type: 'bytea' })
    encryptedValue: Buffer;

    @Column({ type: 'varchar', length: 255 })
    maskedLabel: string;

    @Column({ type: 'uuid', nullable: true })
    sourceRecordId: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    sourceFieldApiName: string | null;

    @Column({ type: 'varchar', length: 100, nullable: true })
    sourceObjectTypeApiName: string | null;

    @Column({ type: 'jsonb', nullable: true })
    metadata: Record<string, any> | null;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

  ---
Task 1.2: Create Encryption Service

File: src/api/common/encryption/encryption.service.ts

/**
* Service for encrypting/decrypting sensitive values.
* Uses AES-256-GCM for authenticated encryption.
*
* Key is loaded from environment variable: PROTECTED_VALUES_ENCRYPTION_KEY
* Must be a 32-byte (256-bit) key, base64 encoded
  */

import { Injectable, OnModuleInit } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService implements OnModuleInit {
private key: Buffer;
private readonly algorithm = 'aes-256-gcm';
private readonly ivLength = 16;
private readonly authTagLength = 16;

    onModuleInit() {
      const keyBase64 = process.env.PROTECTED_VALUES_ENCRYPTION_KEY;
      if (!keyBase64) {
        throw new Error('PROTECTED_VALUES_ENCRYPTION_KEY environment variable is required');
      }
      this.key = Buffer.from(keyBase64, 'base64');
      if (this.key.length !== 32) {
        throw new Error('PROTECTED_VALUES_ENCRYPTION_KEY must be 32 bytes (256 bits)');
      }
    }

    encrypt(plaintext: string): Buffer {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final(),
      ]);

      const authTag = cipher.getAuthTag();

      // Format: [IV (16 bytes)][AuthTag (16 bytes)][Encrypted Data]
      return Buffer.concat([iv, authTag, encrypted]);
    }

    decrypt(encryptedData: Buffer): string {
      const iv = encryptedData.subarray(0, this.ivLength);
      const authTag = encryptedData.subarray(this.ivLength, this.ivLength + this.authTagLength);
      const encrypted = encryptedData.subarray(this.ivLength + this.authTagLength);

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]).toString('utf8');
    }
}

File: src/api/common/encryption/encryption.module.ts

import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

@Global()
@Module({
providers: [EncryptionService],
exports: [EncryptionService],
})
export class EncryptionModule {}

  ---
Task 1.3: Create Masking Utilities

File: src/api/common/masking/masking.utils.ts

/**
* Utilities for masking sensitive data for display purposes.
* These masked values are shown to users in the UI.
  */

export interface MaskingOptions {
visibleStart?: number;
visibleEnd?: number;
maskChar?: string;
}

/**
* Masks a phone number, showing only country code and last few digits
* Input:  "+1 240 483 9876"
* Output: "+1 *** *** 9876"
  */
  export function maskPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

    if (cleaned.length < 4) {
      return '***';
    }

    // Keep first 2-3 chars (country code) and last 4 digits
    const hasPlus = cleaned.startsWith('+');
    const countryCodeEnd = hasPlus ? 3 : 2;
    const countryCode = cleaned.substring(0, countryCodeEnd);
    const lastDigits = cleaned.substring(cleaned.length - 4);
    const middleLength = cleaned.length - countryCodeEnd - 4;

    if (middleLength <= 0) {
      return `${countryCode} ****`;
    }

    // Format masked number nicely
    const maskedMiddle = '*'.repeat(Math.min(middleLength, 6));
    return `${countryCode} ${maskedMiddle} ${lastDigits}`;
}

/**
* Masks an email address
* Input:  "john.doe@example.com"
* Output: "j***@e***.com"
  */
  export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');

    if (!domain) {
      return '***@***.***';
    }

    const domainParts = domain.split('.');
    const tld = domainParts.pop() || 'com';
    const domainName = domainParts.join('.');

    const maskedLocal = localPart.length > 0
      ? `${localPart[0]}${'*'.repeat(Math.min(localPart.length - 1, 3))}`
      : '***';

    const maskedDomain = domainName.length > 0
      ? `${domainName[0]}${'*'.repeat(Math.min(domainName.length - 1, 3))}`
      : '***';

    return `${maskedLocal}@${maskedDomain}.${tld}`;
}

/**
* Masks a street address
* Input:  "123 Main Street, Austin, TX 78701"
* Output: "*** Main Street, Austin, TX 78701"
  */
  export function maskAddress(address: string): string {
  // Mask the street number but keep the rest
  return address.replace(/^\d+\s*/, '*** ');
  }

/**
* Masks structured address object
  */
  export function maskStructuredAddress(address: {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  }): string {
  const parts: string[] = [];

    if (address.street) {
      parts.push(maskAddress(address.street));
    }
    if (address.city) {
      parts.push(address.city);
    }
    if (address.state) {
      parts.push(address.state);
    }
    if (address.zip) {
      // Show first 3 digits of zip
      const maskedZip = address.zip.length > 3
        ? `${address.zip.substring(0, 3)}**`
        : address.zip;
      parts.push(maskedZip);
    }

    return parts.join(', ') || '***';
}

  ---
Task 1.4: Create Protected Value Repository

File: src/api/repositories/postgres/templaates/protected-value.repository.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { ProtectedValue, ProtectedValueType } from '../../../entities/protected/protected-value.entity';
import { EncryptionService } from '../../../common/encryption/encryption.service';
import {
maskPhoneNumber,
maskEmail,
maskStructuredAddress
} from '../../../common/masking/masking.utils';

export interface CreateProtectedValueDto {
companyId: string;
valueType: ProtectedValueType;
plainValue: string | Record<string, any>;
sourceRecordId?: string;
sourceFieldApiName?: string;
sourceObjectTypeApiName?: string;
metadata?: Record<string, any>;
}

export interface ProtectedValueResponse {
id: string;
valueType: ProtectedValueType;
maskedLabel: string;
availableActions: string[];
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
     * Creates a new protected value with encrypted storage
     */
    async createProtectedValue(dto: CreateProtectedValueDto): Promise<ProtectedValue> {
      const valueString = typeof dto.plainValue === 'string'
        ? dto.plainValue
        : JSON.stringify(dto.plainValue);

      const encryptedValue = this.encryptionService.encrypt(valueString);
      const maskedLabel = this.generateMaskedLabel(dto.valueType, dto.plainValue);

      const protectedValue = this.create({
        companyId: dto.companyId,
        valueType: dto.valueType,
        encryptedValue,
        maskedLabel,
        sourceRecordId: dto.sourceRecordId,
        sourceFieldApiName: dto.sourceFieldApiName,
        sourceObjectTypeApiName: dto.sourceObjectTypeApiName,
        metadata: dto.metadata,
      });

      return this.save(protectedValue);
    }

    /**
     * Retrieves the decrypted value - ONLY use for executing actions
     */
    async getDecryptedValue(id: string, companyId: string): Promise<string> {
      const protectedValue = await this.findOne({
        where: { id, companyId },
      });

      if (!protectedValue) {
        throw new NotFoundException('Protected value not found');
      }

      return this.encryptionService.decrypt(protectedValue.encryptedValue);
    }

    /**
     * Retrieves protected value info for frontend (no decryption)
     */
    async getProtectedValueInfo(id: string, companyId: string): Promise<ProtectedValueResponse> {
      const protectedValue = await this.findOne({
        where: { id, companyId },
        select: ['id', 'valueType', 'maskedLabel'],
      });

      if (!protectedValue) {
        throw new NotFoundException('Protected value not found');
      }

      return {
        id: protectedValue.id,
        valueType: protectedValue.valueType,
        maskedLabel: protectedValue.maskedLabel,
        availableActions: this.getActionsForType(protectedValue.valueType),
      };
    }

    /**
     * Bulk fetch protected value info for a record
     */
    async getProtectedValuesForRecord(
      recordId: string,
      companyId: string,
    ): Promise<Map<string, ProtectedValueResponse>> {
      const values = await this.find({
        where: { sourceRecordId: recordId, companyId },
        select: ['id', 'valueType', 'maskedLabel', 'sourceFieldApiName'],
      });

      const result = new Map<string, ProtectedValueResponse>();

      for (const value of values) {
        if (value.sourceFieldApiName) {
          result.set(value.sourceFieldApiName, {
            id: value.id,
            valueType: value.valueType,
            maskedLabel: value.maskedLabel,
            availableActions: this.getActionsForType(value.valueType),
          });
        }
      }

      return result;
    }

    /**
     * Updates the encrypted value
     */
    async updateProtectedValue(
      id: string,
      companyId: string,
      plainValue: string | Record<string, any>,
      valueType: ProtectedValueType,
    ): Promise<ProtectedValue> {
      const existing = await this.findOne({ where: { id, companyId } });

      if (!existing) {
        throw new NotFoundException('Protected value not found');
      }

      const valueString = typeof plainValue === 'string'
        ? plainValue
        : JSON.stringify(plainValue);

      existing.encryptedValue = this.encryptionService.encrypt(valueString);
      existing.maskedLabel = this.generateMaskedLabel(valueType, plainValue);

      return this.save(existing);
    }

    private generateMaskedLabel(
      valueType: ProtectedValueType,
      value: string | Record<string, any>,
    ): string {
      switch (valueType) {
        case ProtectedValueType.PHONE:
          return maskPhoneNumber(typeof value === 'string' ? value : String(value));
        case ProtectedValueType.EMAIL:
          return maskEmail(typeof value === 'string' ? value : String(value));
        case ProtectedValueType.ADDRESS:
          if (typeof value === 'object') {
            return maskStructuredAddress(value as any);
          }
          return maskStructuredAddress({ street: String(value) });
        default:
          return '***';
      }
    }

    private getActionsForType(valueType: ProtectedValueType): string[] {
      switch (valueType) {
        case ProtectedValueType.PHONE:
          return ['call', 'sms'];
        case ProtectedValueType.EMAIL:
          return ['email'];
        case ProtectedValueType.ADDRESS:
          return ['postcard', 'directions'];
        default:
          return [];
      }
    }
}

  ---
PHASE 2: Field Type System

Task 2.1: Add Protected Field Types to Enum

File: src/api/client/object-related/crm-object-field/field-types/field-type.enum.ts

Add these new values to the existing FieldType enum:

// Add to existing enum:
PROTECTED_PHONE = 'protected_phone',
PROTECTED_EMAIL = 'protected_email',
PROTECTED_ADDRESS = 'protected_address',

  ---
Task 2.2: Create Protected Phone Field

File: src/api/client/object-related/crm-object-field/field-types/fields/protected-phone-field.ts

import { BaseFieldDefinition } from '../base-field.interface';

export const ProtectedPhoneField: BaseFieldDefinition = {
type: 'protected_phone',

    // Shape for the stored value (the reference ID)
    shape: {
      type: 'object',
      properties: {
        protectedValueId: { type: 'string', format: 'uuid' },
      },
      required: ['protectedValueId'],
    },

    // Configuration for the field behavior
    configShape: {
      type: 'object',
      properties: {
        // What actions are allowed for this field
        allowedActions: {
          type: 'array',
          items: { type: 'string', enum: ['call', 'sms'] },
          default: ['call', 'sms'],
        },
        // Masking style
        maskingStyle: {
          type: 'string',
          enum: ['last4', 'middle', 'full'],
          default: 'last4',
        },
        // Can the value be revealed for a fee?
        revealable: {
          type: 'boolean',
          default: false,
        },
        // Country code validation
        countryCode: {
          type: 'string',
          description: 'Expected country code (e.g., "US", "GB")',
        },
      },
    },

    // This field type is protected
    isProtected: true,

    // Cannot be used in formulas (no actual value accessible)
    isUsableInFormula: false,
    isFormulaCapable: false,

    // Indicates value is stored in protected_values table
    storageType: 'protected_value',

    // The type of protected value
    protectedValueType: 'phone',
};

  ---
Task 2.3: Create Protected Email Field

File: src/api/client/object-related/crm-object-field/field-types/fields/protected-email-field.ts

import { BaseFieldDefinition } from '../base-field.interface';

export const ProtectedEmailField: BaseFieldDefinition = {
type: 'protected_email',

    shape: {
      type: 'object',
      properties: {
        protectedValueId: { type: 'string', format: 'uuid' },
      },
      required: ['protectedValueId'],
    },

    configShape: {
      type: 'object',
      properties: {
        allowedActions: {
          type: 'array',
          items: { type: 'string', enum: ['email'] },
          default: ['email'],
        },
        maskingStyle: {
          type: 'string',
          enum: ['domain', 'full'],
          default: 'domain',
        },
        revealable: {
          type: 'boolean',
          default: false,
        },
      },
    },

    isProtected: true,
    isUsableInFormula: false,
    isFormulaCapable: false,
    storageType: 'protected_value',
    protectedValueType: 'email',
};

  ---
Task 2.4: Create Protected Address Field

File: src/api/client/object-related/crm-object-field/field-types/fields/protected-address-field.ts

import { BaseFieldDefinition } from '../base-field.interface';

export const ProtectedAddressField: BaseFieldDefinition = {
type: 'protected_address',

    shape: {
      type: 'object',
      properties: {
        protectedValueId: { type: 'string', format: 'uuid' },
      },
      required: ['protectedValueId'],
    },

    configShape: {
      type: 'object',
      properties: {
        allowedActions: {
          type: 'array',
          items: { type: 'string', enum: ['postcard', 'directions'] },
          default: ['postcard'],
        },
        maskingStyle: {
          type: 'string',
          enum: ['street_number', 'full_street', 'minimal'],
          default: 'street_number',
        },
        revealable: {
          type: 'boolean',
          default: false,
        },
        // Address format configuration
        addressFormat: {
          type: 'string',
          enum: ['us', 'international'],
          default: 'us',
        },
      },
    },

    isProtected: true,
    isUsableInFormula: false,
    isFormulaCapable: false,
    storageType: 'protected_value',
    protectedValueType: 'address',
};

  ---
Task 2.5: Update Base Field Interface

File: src/api/client/object-related/crm-object-field/field-types/base-field.interface.ts

Add these properties to the existing interface:

// Add to BaseFieldDefinition interface:

/** Whether this field type stores protected/sensitive data */
isProtected?: boolean;

/** Where the value is stored: 'inline' (in crm_object.data) or 'protected_value' */
storageType?: 'inline' | 'protected_value';

/** For protected fields, the type of protected value */
protectedValueType?: 'phone' | 'email' | 'address';

  ---
Task 2.6: Update Field Registry

File: src/api/client/object-related/crm-object-field/field-types/index.ts

Add imports and register the new field types:

// Add imports:
import { ProtectedPhoneField } from './fields/protected-phone-field';
import { ProtectedEmailField } from './fields/protected-email-field';
import { ProtectedAddressField } from './fields/protected-address-field';

// Add to FieldRegistry object:
[FieldType.PROTECTED_PHONE]: ProtectedPhoneField,
[FieldType.PROTECTED_EMAIL]: ProtectedEmailField,
[FieldType.PROTECTED_ADDRESS]: ProtectedAddressField,

  ---
Task 2.7: Update Field Type Metadata

File: src/api/client/object-related/crm-object-field/metadata/field-type-metadata.ts

Add labels and descriptions:

// Add to FIELD_TYPE_LABELS:
[FieldType.PROTECTED_PHONE]: 'Protected Phone',
[FieldType.PROTECTED_EMAIL]: 'Protected Email',
[FieldType.PROTECTED_ADDRESS]: 'Protected Address',

// Add to FIELD_TYPE_DESCRIPTIONS:
[FieldType.PROTECTED_PHONE]: 'Phone number that is stored encrypted and only accessible through actions (call, SMS). Value is never exposed to the frontend.',
[FieldType.PROTECTED_EMAIL]: 'Email address that is stored encrypted and only accessible through email actions. Value is never exposed to the frontend.',
[FieldType.PROTECTED_ADDRESS]: 'Physical address that is stored encrypted and only accessible through postcard/mailing actions. Value is never exposed to the frontend.',

  ---
PHASE 3: Database Migration

Task 3.1: Create Migration File

File: src/migrations/YYYYMMDDHHMMSS-create-protected-values-table.ts

(Replace YYYYMMDDHHMMSS with current timestamp)

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProtectedValuesTable1234567890123 implements MigrationInterface {
name = 'CreateProtectedValuesTable1234567890123';

    public async up(queryRunner: QueryRunner): Promise<void> {
      // Create enum type
      await queryRunner.query(`
        CREATE TYPE "protected_value_type_enum" AS ENUM ('phone', 'email', 'address')
      `);

      // Create table
      await queryRunner.query(`
        CREATE TABLE "protected_values" (
          "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
          "companyId" uuid NOT NULL,
          "valueType" "protected_value_type_enum" NOT NULL,
          "encryptedValue" bytea NOT NULL,
          "maskedLabel" varchar(255) NOT NULL,
          "sourceRecordId" uuid,
          "sourceFieldApiName" varchar(100),
          "sourceObjectTypeApiName" varchar(100),
          "metadata" jsonb,
          "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
          "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
          CONSTRAINT "PK_protected_values" PRIMARY KEY ("id"),
          CONSTRAINT "FK_protected_values_company" FOREIGN KEY ("companyId") 
            REFERENCES "companies"("id") ON DELETE CASCADE
        )
      `);

      // Create indexes
      await queryRunner.query(`
        CREATE INDEX "IDX_protected_values_company_record" 
        ON "protected_values" ("companyId", "sourceRecordId")
      `);

      await queryRunner.query(`
        CREATE INDEX "IDX_protected_values_company_type" 
        ON "protected_values" ("companyId", "valueType")
      `);

      // Add comment for documentation
      await queryRunner.query(`
        COMMENT ON TABLE "protected_values" IS 
        'Stores encrypted sensitive data (phones, emails, addresses) that should never be exposed to frontend'
      `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.query(`DROP TABLE "protected_values"`);
      await queryRunner.query(`DROP TYPE "protected_value_type_enum"`);
    }
}

  ---
PHASE 4: Response Transformation Service

Task 4.1: Create Protected Field Response Transformer

File: src/api/client/object-related/crm-object/services/protected-field-transformer.service.ts

import { Injectable } from '@nestjs/common';
import { ProtectedValueRepository } from '../../../../repositories/postgres/protected/protected-value.repository';
import { FieldRegistry } from '../../crm-object-field/field-types';
import { FieldType } from '../../crm-object-field/field-types/field-type.enum';

export interface TransformedProtectedField {
type: string;
protected: true;
valueId: string;
display: string;
actions: Array<{
type: string;
enabled: boolean;
}>;
revealable: boolean;
}

@Injectable()
export class ProtectedFieldTransformerService {
constructor(
private readonly protectedValueRepository: ProtectedValueRepository,
) {}

    /**
     * Checks if a field type is protected
     */
    isProtectedFieldType(fieldType: FieldType): boolean {
      const fieldDef = FieldRegistry[fieldType];
      return fieldDef?.isProtected === true;
    }

    /**
     * Transforms a CRM record's protected fields for frontend response.
     * Replaces protected value references with masked display data.
     */
    async transformRecordFields(
      recordId: string,
      companyId: string,
      fields: Record<string, any>,
      fieldDefinitions: Array<{ apiName: string; fieldType: FieldType; configShape?: any }>,
    ): Promise<Record<string, any>> {
      const transformedFields: Record<string, any> = {};

      // Get all protected values for this record
      const protectedValues = await this.protectedValueRepository.getProtectedValuesForRecord(
        recordId,
        companyId,
      );

      for (const fieldDef of fieldDefinitions) {
        const fieldValue = fields[fieldDef.apiName];

        if (this.isProtectedFieldType(fieldDef.fieldType)) {
          // Transform protected field
          const protectedInfo = protectedValues.get(fieldDef.apiName);

          if (protectedInfo) {
            const config = fieldDef.configShape || {};
            transformedFields[fieldDef.apiName] = {
              type: fieldDef.fieldType,
              protected: true,
              valueId: protectedInfo.id,
              display: protectedInfo.maskedLabel,
              actions: protectedInfo.availableActions.map(action => ({
                type: action,
                enabled: (config.allowedActions || protectedInfo.availableActions).includes(action),
              })),
              revealable: config.revealable || false,
            } as TransformedProtectedField;
          } else {
            // No value set
            transformedFields[fieldDef.apiName] = null;
          }
        } else {
          // Regular field - pass through as-is
          transformedFields[fieldDef.apiName] = fieldValue;
        }
      }

      return transformedFields;
    }

    /**
     * Transforms a single protected field value for API response
     */
    async transformProtectedValue(
      protectedValueId: string,
      companyId: string,
      fieldType: FieldType,
      configShape?: Record<string, any>,
    ): Promise<TransformedProtectedField | null> {
      try {
        const protectedInfo = await this.protectedValueRepository.getProtectedValueInfo(
          protectedValueId,
          companyId,
        );

        const config = configShape || {};

        return {
          type: fieldType,
          protected: true,
          valueId: protectedInfo.id,
          display: protectedInfo.maskedLabel,
          actions: protectedInfo.availableActions.map(action => ({
            type: action,
            enabled: (config.allowedActions || protectedInfo.availableActions).includes(action),
          })),
          revealable: config.revealable || false,
        };
      } catch {
        return null;
      }
    }
}

  ---
PHASE 5: Module Integration

Task 5.1: Create Protected Module

File: src/api/common/protected/protected.module.ts

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

  ---
Task 5.2: Update App Module

File: src/app.module.ts

Add imports:

// Add to imports array:
import { EncryptionModule } from './api/common/encryption/encryption.module';
import { ProtectedModule } from './api/common/protected/protected.module';

// In @Module imports:
EncryptionModule,
ProtectedModule,

  ---
Task 5.3: Add Environment Variable

File: .env.example (or document in README)

# Encryption key for protected values (must be 32 bytes, base64 encoded)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
PROTECTED_VALUES_ENCRYPTION_KEY=your-base64-encoded-32-byte-key

  ---
PHASE 6: Index Files & Exports

Task 6.1: Create Entity Index

File: src/api/entities/protected/index.ts

export * from './protected-value.entity';

  ---
Task 6.2: Create Repository Index

File: src/api/repositories/postgres/protected/index.ts

export * from './protected-value.repository';

  ---
Task 6.3: Update Main Entity Index

File: Update existing entity barrel file to include:

export * from './protected/protected-value.entity';

  ---
Summary of Files to Create/Modify

New Files:

1. src/api/entities/protected/protected-value.entity.ts
2. src/api/entities/protected/index.ts
3. src/api/common/encryption/encryption.service.ts
4. src/api/common/encryption/encryption.module.ts
5. src/api/common/masking/masking.utils.ts
6. src/api/repositories/postgres/protected/protected-value.repository.ts
7. src/api/repositories/postgres/protected/index.ts
8. src/api/client/object-related/crm-object-field/field-types/fields/protected-phone-field.ts
9. src/api/client/object-related/crm-object-field/field-types/fields/protected-email-field.ts
10. src/api/client/object-related/crm-object-field/field-types/fields/protected-address-field.ts
11. src/api/client/object-related/crm-object/services/protected-field-transformer.service.ts
12. src/api/common/protected/protected.module.ts
13. src/migrations/YYYYMMDDHHMMSS-create-protected-values-table.ts

Files to Modify:

1. src/api/client/object-related/crm-object-field/field-types/field-type.enum.ts - Add new enum values
2. src/api/client/object-related/crm-object-field/field-types/base-field.interface.ts - Add new properties
3. src/api/client/object-related/crm-object-field/field-types/index.ts - Register new types
4. src/api/client/object-related/crm-object-field/metadata/field-type-metadata.ts - Add labels/descriptions
5. src/app.module.ts - Import new modules

  ---