import {MigrationInterface, QueryRunner} from "typeorm";

export class MigrateTeleChanges1626804229020 implements MigrationInterface {
    name = 'MigrateTeleChanges1626804229020'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event" ADD "imageUrl" text`);
        await queryRunner.query(`ALTER TABLE "post" ADD "imageUrl" text`);
    }

    public async down(_: QueryRunner): Promise<void> {}

}
