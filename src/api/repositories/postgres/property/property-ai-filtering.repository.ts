import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { PropertyAiFiltering } from '../../../entities/property/property-ai-filtering.entity';

@Injectable()
export class PropertyAiFilteringRepository extends Repository<PropertyAiFiltering> {
  constructor(private readonly dataSource: DataSource) {
    super(PropertyAiFiltering, dataSource.createEntityManager());
  }
}
