import {
  DataSource, DeepPartial, DeleteResult,
  EntityManager,
  EntityTarget,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  Repository, UpdateResult,
} from 'typeorm';
import { HasCompany } from './has-company';
import { CompanyContext } from './company.context';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { BadRequestException } from '@nestjs/common';

export class BaseCompanyRepository<T extends HasCompany> extends Repository<T> {
  constructor(
    entity: EntityTarget<T>,
    dataSourceOrManager: DataSource | EntityManager,
    protected readonly  companyContext: CompanyContext,
  ) {
    const manager = dataSourceOrManager instanceof DataSource
      ? dataSourceOrManager.createEntityManager()
      : dataSourceOrManager;

    super(entity, manager);
  }

  private get companyId(): string {
    return this.companyContext.currentCompanyId;
  }

  protected withCompanyScope(
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    const companyCondition = { company: { id: this.companyId } } as FindOptionsWhere<T>;

    if (!where) {
      return companyCondition;
    }

    if (Array.isArray(where)) {
      return where.map(condition => ({
        ...condition,
        ...companyCondition,
      }));
    }

    return {
      ...where,
      ...companyCondition,
    };
  }

  async find(options?: FindManyOptions<T>): Promise<T[]> {
    return super.find({
      ...options,
      where: this.withCompanyScope(options?.where),
    });
  }

  async findOne(options?: FindOneOptions<T>): Promise<T | null> {
    return super.findOne({
      ...options,
      where: this.withCompanyScope(options?.where),
    });
  }

  async findOneBy(where?: FindOptionsWhere<T>): Promise<T | null> {
    return super.findOneBy(this.withCompanyScope(where) as FindOptionsWhere<T>);
  }

  async findBy(where?: FindOptionsWhere<T> | FindOptionsWhere<T>[]): Promise<T[]> {
    return super.findBy(this.withCompanyScope(where));
  }

  create(): T;
  create(entityLike: DeepPartial<T>): T;
  create(entityLikeArray: DeepPartial<T>[]): T[];
  create(entityLike?: DeepPartial<T> | DeepPartial<T>[]): T | T[] {
    if (Array.isArray(entityLike)) {
      return entityLike.map(e => this.create(e)) as T[];
    }

    const company = { id: this.companyId } as T['company'];
    const entity = entityLike ? { ...entityLike, company } : { company };

    return super.create(entity as DeepPartial<T>);
  }

  async update(
    criteria: FindOptionsWhere<T>,
    partialEntity: QueryDeepPartialEntity<T>
  ): Promise<UpdateResult> {
    return super.update(
      this.withCompanyScope(criteria) as FindOptionsWhere<T>,
      partialEntity
    );
  }

  async updateById(
    id: string,
    partialEntity: QueryDeepPartialEntity<T>
  ): Promise<UpdateResult> {
    return this.update({ id } as unknown as FindOptionsWhere<T>, partialEntity);
  }

  async delete(criteria: FindOptionsWhere<T>): Promise<DeleteResult> {
    return super.delete(
      this.withCompanyScope(criteria) as FindOptionsWhere<T>
    );
  }

  async deleteById(id: string): Promise<DeleteResult> {
    return this.delete({ id } as unknown as FindOptionsWhere<T>);
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    return super.count({
      ...options,
      where: this.withCompanyScope(options?.where),
    });
  }

  async countBy(where?: FindOptionsWhere<T>): Promise<number> {
    return super.countBy(
      this.withCompanyScope(where) as FindOptionsWhere<T>
    );
  }

  async findAndCount(options?: FindManyOptions<T>): Promise<[T[], number]> {
    return super.findAndCount({
      ...options,
      where: this.withCompanyScope(options?.where),
    });
  }

  withManager(manager: EntityManager): this {
    // Clone the current repository and rebind it to the provided transaction manager
    const repo = Object.create(Object.getPrototypeOf(this));
    Object.assign(repo, this, {
      manager,
      queryRunner: manager.queryRunner,
    });
    return repo;
  }


  async existsBy(where?: FindOptionsWhere<T>): Promise<boolean> {
    return super.existsBy(
      this.withCompanyScope(where) as FindOptionsWhere<T>
    );
  }

  /*
  async softDelete(criteria: FindOptionsWhere<T>): Promise<UpdateResult> {
  return super.softDelete(
    this.withCompanyScope(criteria) as FindOptionsWhere<T>
  );
}

async restore(criteria: FindOptionsWhere<T>): Promise<UpdateResult> {
  return super.restore(
    this.withCompanyScope(criteria) as FindOptionsWhere<T>
  );
}

async transaction<TX>(operation: (repo: this) => Promise<TX>): Promise<TX> {
  return this.manager.transaction(async (txManager) => {
    const txRepo = new BaseCompanyRepository<T>(
      this.target,
      this.manager.dataSource,
      this.companyContext
    );
    Object.assign(txRepo, { manager: txManager });
    return operation(txRepo);
  });
}

async paginate(options: FindManyOptions<T> & {
  page: number;
  limit: number;
}): Promise<{ data: T[]; total: number; page: number; limit: number }> {
  const [data, total] = await this.findAndCount({
    ...options,
    skip: (options.page - 1) * options.limit,
    take: options.limit,
  });

  return {
    data,
    total,
    page: options.page,
    limit: options.limit,
  };
}

async findWithRelations(
  options: FindManyOptions<T> & { relations: string[] }
): Promise<T[]> {
  return super.find({
    ...options,
    where: this.withCompanyScope(options.where),
    relations: options.relations,
  });
}
   */
}
