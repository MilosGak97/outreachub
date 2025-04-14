import { DataSource, Repository } from 'typeorm';
import { CrmObjectType } from '../../../entities/object-related/crm-object-type.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CrmObjectTypeRepository extends Repository<CrmObjectType> {
  constructor(private readonly dataSource: DataSource) {
    super(CrmObjectType, dataSource.createEntityManager());
  }

  // type code below
}
