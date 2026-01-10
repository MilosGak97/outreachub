import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ProtectedValueRepository } from '../../../../repositories/postgres/protected/protected-value.repository';
import { ProtectedValueType } from '../../../../enums/protected/protected-value-type.enum';

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
  ) {}

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

    return {
      callSid: `CALL_${Date.now()}`,
      status: 'initiated',
    };
  }

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

    return {
      messageSid: `SMS_${Date.now()}`,
      status: 'sent',
    };
  }

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

    return {
      messageId: `EMAIL_${Date.now()}`,
      status: 'sent',
    };
  }
}
