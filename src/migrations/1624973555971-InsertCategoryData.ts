import {MigrationInterface, QueryRunner} from "typeorm";

export class InsertCategoryData1624973555971 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Animal Welfare') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Arts & Heritage') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Children & Youth') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Community') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Disability') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Education') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Elderly') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Environment') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Families') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Health') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Humanitarian') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Social Service') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Sports') `);
        await queryRunner.query(`INSERT INTO "category" ("name") VALUES ('Women & Girls') `);
    }

    public async down(_: QueryRunner): Promise<void> {
    }

}
