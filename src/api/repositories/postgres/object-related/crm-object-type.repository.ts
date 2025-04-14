import { DataSource } from 'typeorm';
import { CrmObjectType } from '../../../entities/object-related/crm-object-type.entity';
import { Injectable } from '@nestjs/common';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';

@Injectable()
export class CrmObjectTypeRepository extends BaseCompanyRepository<CrmObjectType> {
  constructor(private readonly dataSource: DataSource) {
    super(CrmObjectType, dataSource);
  }

  // type code below
}
