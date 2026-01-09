import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Property } from '../../../entities/property/property.entity';

@Injectable()
export class PropertyRepository extends Repository<Property> {
  constructor(private readonly dataSource: DataSource) {
    super(Property, dataSource.createEntityManager());
  }
}
