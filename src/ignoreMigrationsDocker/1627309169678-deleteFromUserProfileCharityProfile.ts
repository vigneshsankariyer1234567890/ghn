import {MigrationInterface, QueryRunner} from "typeorm";

export class deleteFromUserProfileCharityProfile1627309169678 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE from userprofile`)
        await queryRunner.query(`DELETE from charity`)
        await queryRunner.query(`DELETE from charityprofile`)
        await queryRunner.query(`DELETE from "user"`)
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
