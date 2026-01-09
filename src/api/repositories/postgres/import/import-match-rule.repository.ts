import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ImportMatchRule } from '../../../entities/import/import-match-rule.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';

@Injectable()
export class ImportMatchRuleRepository extends BaseCompanyRepository<ImportMatchRule> {
  constructor(
    dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(ImportMatchRule, dataSource, companyContext);
  }
}
