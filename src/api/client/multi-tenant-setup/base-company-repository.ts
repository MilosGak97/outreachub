import {
  Repository,
  EntityTarget,
  DataSource,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
} from 'typeorm';
import { HasCompany } from './has-company';

export class BaseCompanyRepository<T extends HasCompany> extends Repository<T> {
  constructor(entity: EntityTarget<T>, dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
  }

  async findAllByCompany(
    companyId: string,
    options: Omit<FindManyOptions<T>, 'where'> & { where?: FindOptionsWhere<T> },
  ): Promise<T[]> {
    return this.find({
      ...options,
      where: {
        ...options.where,
        company: { id: companyId },
      } as FindOptionsWhere<T>,
    });
  }

  async findOneByCompany(
    companyId: string,
    options: Omit<FindOneOptions<T>, 'where'> & { where?: FindOptionsWhere<T> },
  ): Promise<T | null> {
    return this.findOne({
      ...options,
      where: {
        ...options.where,
        company: { id: companyId },
      } as FindOptionsWhere<T>,
    });
  }
}
