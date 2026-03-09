import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPasscodeExpiresAtToUsers1738713601000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "passcode_expires_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "passcode_expires_at"`,
    );
  }
}
