import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFilterPreset20260116060851 implements MigrationInterface {
  name = 'CreateFilterPreset20260116060851';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "FilterPresetOwnerType" AS ENUM ('USER', 'ADMIN');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "filter_presets" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "company_id" UUID NOT NULL,
        "owner_type" "FilterPresetOwnerType" NOT NULL,
        "owner_id" UUID NOT NULL,
        "concept_key" VARCHAR NOT NULL,
        "table_id" VARCHAR NOT NULL,
        "name" VARCHAR NOT NULL,
        "is_default" BOOLEAN NOT NULL DEFAULT false,
        "filter_state" JSONB NOT NULL,
        "version" INTEGER NOT NULL DEFAULT 1,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_filter_presets_context"
      ON "filter_presets" ("company_id", "owner_type", "owner_id", "concept_key", "table_id")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_filter_presets_name"
      ON "filter_presets" ("company_id", "owner_type", "owner_id", "concept_key", "table_id", "name")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_filter_presets_default"
      ON "filter_presets" ("company_id", "owner_type", "owner_id", "concept_key", "table_id")
      WHERE "is_default" = true
    `);

    await queryRunner.query(`
      ALTER TABLE "filter_presets"
      ADD CONSTRAINT "fk_filter_presets_company"
      FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "filter_presets" DROP CONSTRAINT IF EXISTS "fk_filter_presets_company"
    `);
    await queryRunner.query(`DROP INDEX IF EXISTS "uniq_filter_presets_default"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uniq_filter_presets_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_filter_presets_context"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "filter_presets"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "FilterPresetOwnerType"`);
  }
}
