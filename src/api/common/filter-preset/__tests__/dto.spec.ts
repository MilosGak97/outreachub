import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  CreateFilterPresetDto,
  FilterPresetQueryDto,
} from '../dto';

const validateDto = async <T>(cls: new () => T, payload: Record<string, any>) => {
  const instance = plainToInstance(cls, payload);
  return validate(instance as object);
};

describe('FilterPreset DTOs', () => {
  it('accepts a valid create payload', async () => {
    const errors = await validateDto(CreateFilterPresetDto, {
      conceptKey: 'companies',
      tableId: 'main',
      name: 'Active companies',
      isDefault: true,
      filterState: {
        version: 1,
        searchText: null,
        filters: { status: ['active'] },
      },
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects create payloads missing name', async () => {
    const errors = await validateDto(CreateFilterPresetDto, {
      conceptKey: 'companies',
      tableId: 'main',
      filterState: {
        version: 1,
        filters: {},
      },
    });

    expect(errors.some((error) => error.property === 'name')).toBe(true);
  });

  it('rejects invalid filterState structure', async () => {
    const errors = await validateDto(CreateFilterPresetDto, {
      conceptKey: 'companies',
      tableId: 'main',
      name: 'Bad filters',
      filterState: {
        version: 2,
        filters: 'invalid',
      },
    });

    const filterStateError = errors.find((error) => error.property === 'filterState');
    expect(filterStateError).toBeDefined();
    expect(filterStateError?.children?.length).toBeGreaterThan(0);
  });

  it('validates query params', async () => {
    const validErrors = await validateDto(FilterPresetQueryDto, {
      conceptKey: 'companies',
      tableId: 'main',
    });
    expect(validErrors).toHaveLength(0);

    const invalidErrors = await validateDto(FilterPresetQueryDto, {
      conceptKey: '',
      tableId: 'main',
    });
    expect(invalidErrors.some((error) => error.property === 'conceptKey')).toBe(true);
  });
});
