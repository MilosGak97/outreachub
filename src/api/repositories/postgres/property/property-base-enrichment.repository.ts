import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PropertyBaseEnrichment } from '../../../entities/property/property-base-enrichment.entity';

@Injectable()
export class PropertyBaseEnrichmentRepository extends Repository<PropertyBaseEnrichment> {
  constructor(private readonly dataSource: DataSource) {
    super(PropertyBaseEnrichment, dataSource.createEntityManager());
  }
}
