import 'dotenv/config';
import 'tsconfig-paths/register';
import dataSource from '../src/data-source';

type BackfillRow = {
  id: string;
  state: string;
  current_county: string;
  canonical_county: string;
};

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');

  await dataSource.initialize();

  try {
    const rows = (await dataSource.query(
      `
        SELECT
          p.id,
          p.state,
          p.county_zillow AS current_county,
          c.name AS canonical_county
        FROM properties p
        JOIN counties c
          ON c.state = p.state
         AND LOWER(REGEXP_REPLACE(TRIM(p.county_zillow), '\\s+(County|Borough|Parish)$', '', 'i'))
             = LOWER(REGEXP_REPLACE(TRIM(c.name), '\\s+(County|Borough|Parish)$', '', 'i'))
        WHERE p.county_zillow IS NOT NULL
          AND TRIM(p.county_zillow) <> ''
          AND p.county_zillow IS DISTINCT FROM c.name
        ORDER BY p.state ASC, p.county_zillow ASC, p.id ASC
      `,
    )) as BackfillRow[];

    console.log(`Matched rows needing county_zillow normalization: ${rows.length}`);

    const sample = rows.slice(0, 25);
    sample.forEach((row) => {
      console.log(`${row.state} | ${row.current_county} -> ${row.canonical_county} | ${row.id}`);
    });

    if (!apply) {
      console.log('Dry run only. Re-run with --apply to update properties.county_zillow.');
      return;
    }

    const result = await dataSource.query(
      `
        UPDATE properties p
        SET county_zillow = c.name,
            updated_at = NOW()
        FROM counties c
        WHERE c.state = p.state
          AND p.county_zillow IS NOT NULL
          AND TRIM(p.county_zillow) <> ''
          AND LOWER(REGEXP_REPLACE(TRIM(p.county_zillow), '\\s+(County|Borough|Parish)$', '', 'i'))
              = LOWER(REGEXP_REPLACE(TRIM(c.name), '\\s+(County|Borough|Parish)$', '', 'i'))
          AND p.county_zillow IS DISTINCT FROM c.name
      `,
    );

    console.log('Backfill applied.');
    console.log(result);
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
