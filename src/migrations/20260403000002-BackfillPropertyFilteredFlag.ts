import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillPropertyFilteredFlag20260403000002 implements MigrationInterface {
  name = 'BackfillPropertyFilteredFlag20260403000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "properties"
      SET "filtered" = true,
          "updated_at" = NOW()
      WHERE "ai_status" = 'filtered'
        AND ("filtered" IS DISTINCT FROM true)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "properties"
      SET "filtered" = NULL,
          "updated_at" = NOW()
      WHERE "ai_status" = 'filtered'
        AND "filtered" = true
    `);
  }
}
