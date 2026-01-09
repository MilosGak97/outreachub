// src/core/context/company.context.ts
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class CompanyContext {
  constructor(private readonly cls: ClsService) {}

  get currentCompanyId(): string {
    const companyId = this.cls.get('companyId');
    if (!companyId) {
      throw new Error('Company context not available');
    }
    return companyId;
  }
}