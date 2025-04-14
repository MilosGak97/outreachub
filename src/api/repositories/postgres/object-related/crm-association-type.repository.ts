import { CrmAssociationType } from '../../../entities/object-related/crm-association-type.entity';
import { Injectable } from '@nestjs/common';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';
import { DataSource } from 'typeorm';

@Injectable()
export class CrmAssociationTypeRepository extends BaseCompanyRepository<CrmAssociationType> {
  constructor(private readonly dataSource: DataSource) {
    super(CrmAssociationType, dataSource);
  }
}
