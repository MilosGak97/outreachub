import { CrmObject } from '../../../entities/object-related/crm-object.entity';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class CrmObjectRepository extends Repository<CrmObject>{
  constructor(private readonly dataSource: DataSource) {
    super(CrmObject, dataSource.createEntityManager());
  }

  // below here we can  star
}