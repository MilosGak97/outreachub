import {
  applyListingSearchFilters,
  buildCountyFilters,
} from './property-listing.helpers';

describe('property-listing.helpers county filters', () => {
  it('normalizes county filters from the counties endpoint format', () => {
    expect(buildCountyFilters(['Cook County, IL', 'Cook County, IL', 'Orange, CA'])).toEqual([
      { countyName: 'Cook County', countyLookupName: 'Cook', state: 'IL' },
      { countyName: 'Orange', countyLookupName: 'Orange', state: 'CA' },
    ]);
  });

  it('matches counties exactly against either county_zillow or the linked county row', () => {
    const andWhere = jest.fn().mockReturnThis();
    const qb = { andWhere } as any;

    applyListingSearchFilters(qb, {
      counties: ['Cook County, IL'],
      createdFrom: '2026-04-09T00:00:00.000Z',
    } as any);

    expect(andWhere).toHaveBeenCalledWith(
      expect.stringContaining(
        "(((LOWER(REGEXP_REPLACE(TRIM(property.countyZillow), '\\s+(County|Borough|Parish)$', '', 'i')) = LOWER(:countyName0) AND property.state = :countyState0) OR (LOWER(REGEXP_REPLACE(TRIM(county.name), '\\s+(County|Borough|Parish)$', '', 'i')) = LOWER(:countyName0) AND county.state = :countyState0)))",
      ),
      {
        countyName0: 'Cook',
        countyState0: 'IL',
      },
    );
  });
});
