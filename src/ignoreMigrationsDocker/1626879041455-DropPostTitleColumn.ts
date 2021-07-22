import {MigrationInterface, QueryRunner} from "typeorm";

export class DropPostTitleColumn1626879041455 implements MigrationInterface {
    name = 'DropPostTitleColumn1626879041455'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" DROP title`);
    }

    public async down(_: QueryRunner): Promise<void> {
        
    }

}
