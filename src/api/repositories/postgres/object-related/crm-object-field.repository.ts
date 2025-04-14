import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CrmObjectField } from '../../../entities/object-related/crm-object-field.entity';
import { BaseCompanyRepository } from '../../../client/multi-tenant-setup/base-company-repository';

@Injectable()
export class CrmObjectFieldRepository extends BaseCompanyRepository<CrmObjectField> {
  constructor(private readonly dataSource: DataSource) {
    super(CrmObjectField, dataSource);
  }

  // start code below
}
