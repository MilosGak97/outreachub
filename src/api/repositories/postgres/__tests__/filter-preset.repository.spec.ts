import { DataSource } from 'typeorm';
import { FilterPresetRepository } from '../filter-preset.repository';
import { FilterPresetOwnerType } from '../../../enums/filter-preset/filter-preset-owner-type.enum';
import { FilterPreset } from '../../../entities/filter-preset.entity';

type WhereCall = { clause: string; params?: Record<string, any> };

class FakeQueryBuilder<T> {
  public whereCalls: WhereCall[] = [];
  public orderByCalls: Array<{ clause: string; order: 'ASC' | 'DESC' }> = [];
  public selectCalls: Array<{ selection: string; alias?: string }> = [];
  public limitCalls: number[] = [];
  public updateCall: any;
  public setCall: Record<string, any> | null = null;

  constructor(
    private readonly result: {
      many?: T[];
      one?: T | null;
      count?: number;
      rawOne?: any;
    } = {},
  ) {}

  where = jest.fn((clause: string, params?: Record<string, any>) => {
    this.whereCalls.push({ clause, params });
    return this;
  });

  andWhere = jest.fn((clause: string, params?: Record<string, any>) => {
    this.whereCalls.push({ clause, params });
    return this;
  });

  orderBy = jest.fn((clause: string, order: 'ASC' | 'DESC') => {
    this.orderByCalls.push({ clause, order });
    return this;
  });

  addOrderBy = jest.fn((clause: string, order: 'ASC' | 'DESC') => {
    this.orderByCalls.push({ clause, order });
    return this;
  });

  select = jest.fn((selection: string, alias?: string) => {
    this.selectCalls.push({ selection, alias });
    return this;
  });

  limit = jest.fn((limit: number) => {
    this.limitCalls.push(limit);
    return this;
  });

  update = jest.fn((entity?: any) => {
    this.updateCall = entity;
    return this;
  });

  set = jest.fn((values: Record<string, any>) => {
    this.setCall = values;
    return this;
  });

  execute = jest.fn(async () => ({ affected: 1 }));
  getMany = jest.fn(async () => this.result.many ?? []);
  getOne = jest.fn(async () => this.result.one ?? null);
  getCount = jest.fn(async () => this.result.count ?? 0);
  getRawOne = jest.fn(async () => this.result.rawOne);
}

const createRepository = (builder: FakeQueryBuilder<FilterPreset>) => {
  const dataSource = {
    createEntityManager: jest.fn(() => ({})),
  } as unknown as DataSource;

  const repo = new FilterPresetRepository(dataSource);
  jest.spyOn(repo, 'createQueryBuilder').mockReturnValue(builder as any);
  return repo;
};

describe('FilterPresetRepository', () => {
  const context = {
    companyId: 'company-1',
    ownerType: FilterPresetOwnerType.USER,
    ownerId: 'owner-1',
    conceptKey: 'companies',
    tableId: 'main',
  };

  it('findByContext filters by context and sorts default first then name', async () => {
    const builder = new FakeQueryBuilder<FilterPreset>();
    const repo = createRepository(builder);

    await repo.findByContext(
      context.companyId,
      context.ownerType,
      context.ownerId,
      context.conceptKey,
      context.tableId,
    );

    expect(builder.whereCalls).toEqual([
      { clause: 'preset.companyId = :companyId', params: { companyId: context.companyId } },
      { clause: 'preset.ownerType = :ownerType', params: { ownerType: context.ownerType } },
      { clause: 'preset.ownerId = :ownerId', params: { ownerId: context.ownerId } },
      { clause: 'preset.conceptKey = :conceptKey', params: { conceptKey: context.conceptKey } },
      { clause: 'preset.tableId = :tableId', params: { tableId: context.tableId } },
    ]);
    expect(builder.orderByCalls).toEqual([
      { clause: 'preset.isDefault', order: 'DESC' },
      { clause: 'preset.name', order: 'ASC' },
    ]);
  });

  it('findDefaultByContext enforces context and default flag', async () => {
    const builder = new FakeQueryBuilder<FilterPreset>();
    const repo = createRepository(builder);

    await repo.findDefaultByContext(
      context.companyId,
      context.ownerType,
      context.ownerId,
      context.conceptKey,
      context.tableId,
    );

    expect(builder.whereCalls).toContainEqual({
      clause: 'preset.companyId = :companyId',
      params: { companyId: context.companyId },
    });
    expect(builder.whereCalls).toContainEqual({
      clause: 'preset.ownerType = :ownerType',
      params: { ownerType: context.ownerType },
    });
    expect(builder.whereCalls).toContainEqual({
      clause: 'preset.ownerId = :ownerId',
      params: { ownerId: context.ownerId },
    });
    expect(builder.whereCalls).toContainEqual({
      clause: 'preset.isDefault = :isDefault',
      params: { isDefault: true },
    });
  });

  it('findByIdAndOwner enforces tenant and owner isolation', async () => {
    const builder = new FakeQueryBuilder<FilterPreset>();
    const repo = createRepository(builder);

    await repo.findByIdAndOwner('preset-1', context.companyId, context.ownerType, context.ownerId);

    expect(builder.whereCalls).toEqual([
      { clause: 'preset.id = :id', params: { id: 'preset-1' } },
      { clause: 'preset.companyId = :companyId', params: { companyId: context.companyId } },
      { clause: 'preset.ownerType = :ownerType', params: { ownerType: context.ownerType } },
      { clause: 'preset.ownerId = :ownerId', params: { ownerId: context.ownerId } },
    ]);
  });

  it('countByContext uses tenant-scoped context filters', async () => {
    const builder = new FakeQueryBuilder<FilterPreset>({ count: 12 });
    const repo = createRepository(builder);

    const count = await repo.countByContext(
      context.companyId,
      context.ownerType,
      context.ownerId,
      context.conceptKey,
      context.tableId,
    );

    expect(count).toBe(12);
    expect(builder.whereCalls[0]).toEqual({
      clause: 'preset.companyId = :companyId',
      params: { companyId: context.companyId },
    });
  });

  it('clearDefaultInContext only updates matching context', async () => {
    const builder = new FakeQueryBuilder<FilterPreset>();
    const repo = createRepository(builder);

    await repo.clearDefaultInContext(
      context.companyId,
      context.ownerType,
      context.ownerId,
      context.conceptKey,
      context.tableId,
    );

    expect(builder.updateCall).toBe(FilterPreset);
    expect(builder.setCall).toEqual({ isDefault: false });
    expect(builder.whereCalls).toContainEqual({
      clause: 'companyId = :companyId',
      params: { companyId: context.companyId },
    });
    expect(builder.whereCalls).toContainEqual({
      clause: 'ownerType = :ownerType',
      params: { ownerType: context.ownerType },
    });
    expect(builder.whereCalls).toContainEqual({
      clause: 'ownerId = :ownerId',
      params: { ownerId: context.ownerId },
    });
    expect(builder.whereCalls).toContainEqual({
      clause: 'conceptKey = :conceptKey',
      params: { conceptKey: context.conceptKey },
    });
    expect(builder.whereCalls).toContainEqual({
      clause: 'tableId = :tableId',
      params: { tableId: context.tableId },
    });
    expect(builder.whereCalls).toContainEqual({
      clause: 'isDefault = :isDefault',
      params: { isDefault: true },
    });
  });

  it('existsByNameInContext checks case-insensitive name match', async () => {
    const builder = new FakeQueryBuilder<FilterPreset>({ rawOne: { id: 'preset-1' } });
    const repo = createRepository(builder);

    const exists = await repo.existsByNameInContext(
      context.companyId,
      context.ownerType,
      context.ownerId,
      context.conceptKey,
      context.tableId,
      'Default',
    );

    expect(exists).toBe(true);
    expect(builder.whereCalls).toContainEqual({
      clause: 'LOWER(preset.name) = LOWER(:name)',
      params: { name: 'Default' },
    });
  });
});
