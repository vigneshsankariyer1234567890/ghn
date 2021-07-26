import {MigrationInterface, QueryRunner} from "typeorm";

export class insertCategoryUserrole1627312926371 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        INSERT INTO category ("name") VALUES ('Animal Welfare'), ('Arts & Heritage'), 
('Children & Youth'), ('Community'), ('Disability'), ('Education'), 
('Elderly'), ('Environment'), ('Families'), ('Health'), ('Humanitarian'), 
('Social Service'), ('Sports'), ('Women & Girls');
        `);
        await queryRunner.query(`INSERT INTO userrole ("roleName") VALUES ('ADMIN'),('VOLUNTEER');`);

    }

    public async down(_: QueryRunner): Promise<void> {
    }

}
