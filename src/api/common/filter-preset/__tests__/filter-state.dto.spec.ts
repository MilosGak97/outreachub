import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FilterStateDto } from '../dto';

const validateDto = async (payload: Record<string, any>) => {
  const instance = plainToInstance(FilterStateDto, payload);
  return validate(instance as object);
};

describe('FilterStateDto', () => {
  it('accepts valid static filter state', async () => {
    const errors = await validateDto({
      version: 1,
      searchText: 'active',
      filters: { status: ['active'] },
      meta: { createdFrom: 'ui' },
    });

    expect(errors).toHaveLength(0);
  });

  it('accepts valid dynamic filter state', async () => {
    const errors = await validateDto({
      version: 1,
      searchText: null,
      filters: {
        logic: 'AND',
        items: [
          {
            fieldId: '550e8400-e29b-41d4-a716-446655440000',
            op: 'eq',
            value: 'Active',
          },
        ],
      },
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects invalid version', async () => {
    const errors = await validateDto({
      version: 2,
      filters: { status: ['active'] },
    });

    expect(errors.some((error) => error.property === 'version')).toBe(true);
  });

  it('rejects missing required fields', async () => {
    const errors = await validateDto({
      version: 1,
    });

    expect(errors.some((error) => error.property === 'filters')).toBe(true);
  });
});
