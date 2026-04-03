import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPropertyUniquenessIndexes20260403000001 implements MigrationInterface {
  name = 'AddPropertyUniquenessIndexes20260403000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_properties_zpid_unique"
      ON "properties" ("zpid")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_pl_prop_status_unique"
      ON "property-listings" ("property_id", "status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_pl_prop_status_unique"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_properties_zpid_unique"`);
  }
}
