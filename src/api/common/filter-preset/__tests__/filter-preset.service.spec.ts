import {
  ConflictException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FilterPresetService } from '../filter-preset.service';
import { FilterPresetOwnerType } from '../../../enums/filter-preset/filter-preset-owner-type.enum';
import { FilterPresetRepository } from '../../../repositories/postgres/filter-preset.repository';

type FilterPresetRepositoryMock = {
  existsByNameInContext: jest.Mock<Promise<boolean>, any>;
  countByContext: jest.Mock<Promise<number>, any>;
  clearDefaultInContext: jest.Mock<Promise<void>, any>;
  findByContext: jest.Mock<Promise<any[]>, any>;
  findByIdAndOwner: jest.Mock<Promise<any | null>, any>;
  findDefaultByContext: jest.Mock<Promise<any | null>, any>;
  remove: jest.Mock<Promise<any>, any>;
  create: jest.Mock<any, any>;
  save: jest.Mock<Promise<any>, any>;
};

const createRepositoryMock = (): FilterPresetRepositoryMock => ({
  existsByNameInContext: jest.fn(),
  countByContext: jest.fn(),
  clearDefaultInContext: jest.fn(),
  findByContext: jest.fn(),
  findByIdAndOwner: jest.fn(),
  findDefaultByContext: jest.fn(),
  remove: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('FilterPresetService', () => {
  const baseDto = {
    conceptKey: 'companies',
    tableId: 'main',
    name: 'Active companies',
    isDefault: false,
    filterState: {
      version: 1,
      searchText: null,
      filters: { status: ['active'] },
    },
  };

  const ownerType = FilterPresetOwnerType.USER;
  const ownerId = 'owner-1';
  const companyId = 'company-1';
  const createdAt = new Date('2025-01-01T00:00:00.000Z');
  const updatedAt = new Date('2025-01-02T00:00:00.000Z');

  const buildPreset = (overrides: Record<string, any> = {}) => ({
    id: 'preset-1',
    name: baseDto.name,
    isDefault: false,
    filterState: baseDto.filterState,
    conceptKey: baseDto.conceptKey,
    tableId: baseDto.tableId,
    companyId,
    ownerType: FilterPresetOwnerType.USER,
    ownerId,
    createdAt,
    updatedAt,
    ...overrides,
  });

  it('creates preset successfully', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    repo.existsByNameInContext.mockResolvedValue(false);
    repo.countByContext.mockResolvedValue(0);
    repo.create.mockImplementation((payload) => ({ id: 'preset-1', ...payload }));
    repo.save.mockImplementation(async (payload) => payload);

    const result = await service.createPreset(
      baseDto,
      ownerType,
      ownerId,
      companyId,
    );

    expect(result.id).toBe('preset-1');
    expect(repo.existsByNameInContext).toHaveBeenCalledWith(
      companyId,
      FilterPresetOwnerType.USER,
      ownerId,
      baseDto.conceptKey,
      baseDto.tableId,
      baseDto.name,
    );
    expect(repo.countByContext).toHaveBeenCalled();
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId,
        ownerType: FilterPresetOwnerType.USER,
        ownerId,
        conceptKey: baseDto.conceptKey,
        tableId: baseDto.tableId,
        name: baseDto.name,
        isDefault: false,
        filterState: baseDto.filterState,
      }),
    );
  });

  it('throws 409 for duplicate name', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    repo.existsByNameInContext.mockResolvedValue(true);

    await expect(
      service.createPreset(baseDto, ownerType, ownerId, companyId),
    ).rejects.toThrow(ConflictException);
    expect(repo.countByContext).not.toHaveBeenCalled();
  });

  it('allows creating the 50th preset but rejects the 51st', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    repo.existsByNameInContext.mockResolvedValue(false);
    repo.countByContext.mockResolvedValue(49);
    repo.create.mockImplementation((payload) => ({ id: 'preset-50', ...payload }));
    repo.save.mockImplementation(async (payload) => payload);

    const created = await service.createPreset(baseDto, ownerType, ownerId, companyId);
    expect(created.id).toBe('preset-50');

    repo.countByContext.mockResolvedValue(50);

    await expect(
      service.createPreset(baseDto, ownerType, ownerId, companyId),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('clears previous default when setting new default', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    repo.existsByNameInContext.mockResolvedValue(false);
    repo.countByContext.mockResolvedValue(0);
    repo.create.mockImplementation((payload) => ({ id: 'preset-default', ...payload }));
    repo.save.mockImplementation(async (payload) => payload);

    await service.createPreset(
      { ...baseDto, isDefault: true },
      ownerType,
      ownerId,
      companyId,
    );

    expect(repo.clearDefaultInContext).toHaveBeenCalledWith(
      companyId,
      FilterPresetOwnerType.USER,
      ownerId,
      baseDto.conceptKey,
      baseDto.tableId,
    );
    expect(repo.clearDefaultInContext.mock.invocationCallOrder[0]).toBeLessThan(
      repo.save.mock.invocationCallOrder[0],
    );
  });

  it('lists presets for context', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    repo.findByContext.mockResolvedValue([
      buildPreset({ id: 'preset-1', isDefault: true }),
      buildPreset({ id: 'preset-2', name: 'B preset' }),
    ]);

    const response = await service.listPresets(
      baseDto.conceptKey,
      baseDto.tableId,
      ownerType,
      ownerId,
      companyId,
    );

    expect(repo.findByContext).toHaveBeenCalledWith(
      companyId,
      FilterPresetOwnerType.USER,
      ownerId,
      baseDto.conceptKey,
      baseDto.tableId,
    );
    expect(response.context).toEqual({
      conceptKey: baseDto.conceptKey,
      tableId: baseDto.tableId,
    });
    expect(response.items).toHaveLength(2);
    expect(response.items[0]).toMatchObject({
      id: 'preset-1',
      name: baseDto.name,
      isDefault: true,
      conceptKey: baseDto.conceptKey,
      tableId: baseDto.tableId,
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
    expect(response.limit).toBe(50);
  });

  it('returns empty list for new context', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    repo.findByContext.mockResolvedValue([]);

    const response = await service.listPresets(
      'new-concept',
      'new-table',
      ownerType,
      ownerId,
      companyId,
    );

    expect(response.items).toEqual([]);
  });

  it('relies on repository to filter by context', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    // Repository is expected to only return presets matching the context
    repo.findByContext.mockResolvedValue([
      buildPreset({ id: 'preset-1' }),
      buildPreset({ id: 'preset-2', name: 'Another preset' }),
    ]);

    const response = await service.listPresets(
      baseDto.conceptKey,
      baseDto.tableId,
      ownerType,
      ownerId,
      companyId,
    );

    // Verify repository is called with correct context params
    expect(repo.findByContext).toHaveBeenCalledWith(
      companyId,
      FilterPresetOwnerType.USER,
      ownerId,
      baseDto.conceptKey,
      baseDto.tableId,
    );
    // Service trusts repository to filter correctly
    expect(response.items).toHaveLength(2);
  });

  it('gets preset by ID when owned', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    const preset = buildPreset({ id: 'preset-1' });
    repo.findByIdAndOwner.mockResolvedValue(preset);

    const result = await service.getPresetById(
      'preset-1',
      ownerType,
      ownerId,
      companyId,
    );

    expect(repo.findByIdAndOwner).toHaveBeenCalledWith(
      'preset-1',
      companyId,
      FilterPresetOwnerType.USER,
      ownerId,
    );
    expect(result).toBe(preset);
  });

  it('returns 404 for non-existent ID', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    repo.findByIdAndOwner.mockResolvedValue(null);

    await expect(
      service.getPresetById('missing', ownerType, ownerId, companyId),
    ).rejects.toThrow('Preset not found');
  });

  it('returns 404 for preset owned by different user', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    repo.findByIdAndOwner.mockResolvedValue(null);

    await expect(
      service.getPresetById('preset-2', ownerType, 'other-owner', companyId),
    ).rejects.toThrow('Preset not found');
  });

  it('updates name successfully', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    const preset = buildPreset({ id: 'preset-1', name: 'Old name' });
    repo.findByIdAndOwner.mockResolvedValue(preset);
    repo.existsByNameInContext.mockResolvedValue(false);
    repo.save.mockImplementation(async (payload) => payload);

    const result = await service.updatePreset(
      'preset-1',
      { name: 'New name' },
      ownerType,
      ownerId,
      companyId,
    );

    expect(result.name).toBe('New name');
    expect(repo.existsByNameInContext).toHaveBeenCalledWith(
      companyId,
      FilterPresetOwnerType.USER,
      ownerId,
      preset.conceptKey,
      preset.tableId,
      'New name',
    );
  });

  it('updates filterState successfully', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    const preset = buildPreset({ id: 'preset-1' });
    repo.findByIdAndOwner.mockResolvedValue(preset);
    repo.save.mockImplementation(async (payload) => payload);

    const newState = { version: 1, filters: { status: ['inactive'] } };
    const result = await service.updatePreset(
      'preset-1',
      { filterState: newState },
      ownerType,
      ownerId,
      companyId,
    );

    expect(result.filterState).toEqual(newState);
  });

  it('rename to duplicate name returns 409', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    const preset = buildPreset({ id: 'preset-1', name: 'Old name' });
    repo.findByIdAndOwner.mockResolvedValue(preset);
    repo.existsByNameInContext.mockResolvedValue(true);

    await expect(
      service.updatePreset(
        'preset-1',
        { name: 'Duplicate' },
        ownerType,
        ownerId,
        companyId,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it('setting isDefault=true clears previous default', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    const preset = buildPreset({ id: 'preset-1', isDefault: false });
    repo.findByIdAndOwner.mockResolvedValue(preset);
    repo.save.mockImplementation(async (payload) => payload);

    await service.updatePreset(
      'preset-1',
      { isDefault: true },
      ownerType,
      ownerId,
      companyId,
    );

    expect(repo.clearDefaultInContext).toHaveBeenCalledWith(
      companyId,
      FilterPresetOwnerType.USER,
      ownerId,
      preset.conceptKey,
      preset.tableId,
    );
  });

  it('sets preset as default and clears previous default', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    const preset = buildPreset({ id: 'preset-1', isDefault: false });
    repo.findByIdAndOwner.mockResolvedValue(preset);
    repo.save.mockImplementation(async (payload) => payload);

    const result = await service.setDefault('preset-1', ownerType, ownerId, companyId);

    expect(repo.clearDefaultInContext).toHaveBeenCalledWith(
      companyId,
      FilterPresetOwnerType.USER,
      ownerId,
      preset.conceptKey,
      preset.tableId,
    );
    expect(result.isDefault).toBe(true);
  });

  it('only one default exists after operation', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    const preset = buildPreset({ id: 'preset-1', isDefault: false });
    repo.findByIdAndOwner.mockResolvedValue(preset);
    repo.save.mockImplementation(async (payload) => payload);

    await service.setDefault('preset-1', ownerType, ownerId, companyId);

    expect(repo.clearDefaultInContext).toHaveBeenCalledTimes(1);
  });

  it('clears existing default', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    const preset = buildPreset({ id: 'preset-1', isDefault: true });
    repo.findDefaultByContext.mockResolvedValue(preset);
    repo.save.mockImplementation(async (payload) => payload);

    const result = await service.clearDefault(
      baseDto.conceptKey,
      baseDto.tableId,
      ownerType,
      ownerId,
      companyId,
    );

    expect(result).toEqual({ cleared: true });
    expect(repo.findDefaultByContext).toHaveBeenCalledWith(
      companyId,
      FilterPresetOwnerType.USER,
      ownerId,
      baseDto.conceptKey,
      baseDto.tableId,
    );
    expect(preset.isDefault).toBe(false);
    expect(repo.save).toHaveBeenCalledWith(preset);
  });

  it('succeeds when no default exists', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    repo.findDefaultByContext.mockResolvedValue(null);

    const result = await service.clearDefault(
      baseDto.conceptKey,
      baseDto.tableId,
      ownerType,
      ownerId,
      companyId,
    );

    expect(result).toEqual({ cleared: true });
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('does not affect other contexts', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    repo.findDefaultByContext.mockResolvedValue(null);

    await service.clearDefault(
      'other-concept',
      'other-table',
      ownerType,
      ownerId,
      companyId,
    );

    expect(repo.findDefaultByContext).toHaveBeenCalledWith(
      companyId,
      FilterPresetOwnerType.USER,
      ownerId,
      'other-concept',
      'other-table',
    );
  });

  it('deletes preset successfully', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    const preset = buildPreset({ id: 'preset-1', isDefault: false });
    repo.findByIdAndOwner.mockResolvedValue(preset);
    repo.remove.mockResolvedValue(preset);

    const result = await service.deletePreset('preset-1', ownerType, ownerId, companyId);

    expect(result).toEqual({ deleted: true });
    expect(repo.remove).toHaveBeenCalledWith(preset);
    expect(repo.clearDefaultInContext).not.toHaveBeenCalled();
  });

  it('returns 404 for non-existent preset on delete', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    repo.findByIdAndOwner.mockResolvedValue(null);

    await expect(
      service.deletePreset('missing', ownerType, ownerId, companyId),
    ).rejects.toThrow(NotFoundException);
  });

  it('returns 404 for preset owned by different user on delete', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    repo.findByIdAndOwner.mockResolvedValue(null);

    await expect(
      service.deletePreset('preset-2', ownerType, 'other-owner', companyId),
    ).rejects.toThrow(NotFoundException);
  });

  it('deleting default preset removes it directly without separate clear', async () => {
    const repo = createRepositoryMock();
    const service = new FilterPresetService(repo as unknown as FilterPresetRepository);

    const preset = buildPreset({ id: 'preset-1', isDefault: true });
    repo.findByIdAndOwner.mockResolvedValue(preset);
    repo.remove.mockResolvedValue(preset);

    const result = await service.deletePreset('preset-1', ownerType, ownerId, companyId);

    expect(result).toEqual({ deleted: true });
    expect(repo.remove).toHaveBeenCalledWith(preset);
    // No separate clearDefaultInContext call needed - the preset is simply deleted
    expect(repo.clearDefaultInContext).not.toHaveBeenCalled();
  });
});
