import {MigrationInterface, QueryRunner} from "typeorm";

export class InsertUserRole1624973651068 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "userrole" ("roleName") VALUES ('ADMIN')`);
        await queryRunner.query(`INSERT INTO "userrole" ("roleName") VALUES ('VOLUNTEER')`);
    }

    public async down(_: QueryRunner): Promise<void> {
    }

}
