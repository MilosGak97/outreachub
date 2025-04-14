import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CrmObjectAssociation } from '../../../entities/object-related/crm-object-association.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';

@Injectable()
export class CrmObjectAssociationRepository extends BaseCompanyRepository<CrmObjectAssociation>{
  constructor(private readonly dataSource: DataSource) {
    super(CrmObjectAssociation, dataSource);
  }

  // below here we can  start code
}