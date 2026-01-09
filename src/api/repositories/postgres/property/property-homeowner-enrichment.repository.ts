import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PropertyHomeownerEnrichment } from '../../../entities/property/property-homeowner-enrichment.entity';

@Injectable()
export class PropertyHomeownerEnrichmentRepository extends Repository<PropertyHomeownerEnrichment> {
  constructor(private readonly dataSource: DataSource) {
    super(PropertyHomeownerEnrichment, dataSource.createEntityManager());
  }
}
