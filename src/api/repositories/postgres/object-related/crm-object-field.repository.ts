import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CrmObjectField } from '../../../entities/object-related/crm-object-field.entity';

@Injectable()
export class CrmObjectFieldRepository extends Repository<CrmObjectField> {
  constructor(private readonly dataSource: DataSource) {
    super(CrmObjectField, dataSource.createEntityManager());
  }

  // start code below
}
