import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterUsersAddVerified1627202221710 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN verified boolean NOT NULL DEFAULT false`);
    }

    public async down(_: QueryRunner): Promise<void> {
    }

}
