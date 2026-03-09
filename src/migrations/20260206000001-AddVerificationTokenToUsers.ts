import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVerificationTokenToUsers20260206000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "verification_token" VARCHAR`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD "verification_token_expires_at" TIMESTAMP`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "verification_token_expires_at"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "verification_token"`,
    );
  }
}
