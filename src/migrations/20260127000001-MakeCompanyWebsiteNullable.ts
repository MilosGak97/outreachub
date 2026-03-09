import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeCompanyWebsiteNullable20260127000001 implements MigrationInterface {
  name = 'MakeCompanyWebsiteNullable20260127000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies" ALTER COLUMN "website" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies" ALTER COLUMN "website" SET NOT NULL
    `);
  }
}
