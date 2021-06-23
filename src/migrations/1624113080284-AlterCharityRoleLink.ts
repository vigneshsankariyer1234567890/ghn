import {MigrationInterface, QueryRunner} from "typeorm";

export class AlterCharityRoleLink1624113080284 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "charityrolelink" ADD "auditstat" boolean NOT NULL DEFAULT true`);
    }

    public async down(_: QueryRunner): Promise<void> {
    }

}
