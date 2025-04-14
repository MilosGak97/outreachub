import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CrmObjectAssociation } from '../../../entities/object-related/crm-object-association.entity';

@Injectable()
export class ObjectAssociationRepository extends Repository<CrmObjectAssociation>{
  constructor(private readonly dataSource: DataSource) {
    super(CrmObjectAssociation, dataSource.createEntityManager());
  }

  // below here we can  start code
}