import { CrmObject } from '../../../entities/object/crm-object.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';

@Injectable()
export class CrmObjectRepository extends BaseCompanyRepository<CrmObject>{
  constructor(
    private readonly dataSource: DataSource,
    companyContext: CompanyContext, // Add this
  ) {
    super(CrmObject, dataSource, companyContext); // Now passing all 3 args
  }


  // below here we can  star
}