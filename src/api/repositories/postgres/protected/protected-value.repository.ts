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

  async deleteBySourceRecord(recordId: string, companyId: string): Promise<void> {
    await this.delete({ sourceRecordId: recordId, companyId });
  }

  async deleteByIdAndCompany(id: string, companyId: string): Promise<boolean> {
    const result = await this.delete({ id, companyId });
    return (result.affected ?? 0) > 0;
  }
}
