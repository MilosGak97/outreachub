import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CrmObjectAssociation } from '../../../entities/object/crm-object-association.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { CompanyContext } from '../../../client/multi-tenant-setup/company.context';

@Injectable()
export class CrmObjectAssociationRepository extends BaseCompanyRepository<CrmObjectAssociation> {
  constructor(
    private readonly dataSource: DataSource,
    companyContext: CompanyContext,
  ) {
    super(CrmObjectAssociation, dataSource, companyContext);
  }

  // below here we can  start code
}
