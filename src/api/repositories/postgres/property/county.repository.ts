import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { County } from '../../../entities/property/county.entity';
import { State } from '../../../enums/property/state.enum';

@Injectable()
export class CountyRepository extends Repository<County> {
  constructor(private readonly dataSource: DataSource) {
    super(County, dataSource.createEntityManager());
  }

  async getCountyDisplayNames(search?: string, state?: State): Promise<string[]> {
    const qb = this.createQueryBuilder('county')
      .select(['county.name', 'county.state'])
      .orderBy('county.name', 'ASC');

    if (search) {
      qb.andWhere('county.name ILIKE :search', { search: `%${search}%` });
    }

    if (state) {
      qb.andWhere('county.state = :state', { state });
    }

    const counties = await qb.getMany();

    return counties.map((county) => `${county.name}, ${county.state}`);
  }
}
