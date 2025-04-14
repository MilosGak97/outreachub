import { DataSource, Repository } from 'typeorm';
import { CrmAssociationType } from '../../../entities/object-related/crm-association-type.entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CrmAssociationTypeRepository extends Repository<CrmAssociationType> {
  constructor(private readonly dataSource: DataSource) {
    super(CrmAssociationType, dataSource.createEntityManager());
  }
}
