import { CrmObject } from '../../../entities/object-related/crm-object.entity';
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';

@Injectable()
export class CrmObjectRepository extends BaseCompanyRepository<CrmObject>{
  constructor(private readonly dataSource: DataSource) {
    super(CrmObject, dataSource);
  }

  // below here we can  star
}