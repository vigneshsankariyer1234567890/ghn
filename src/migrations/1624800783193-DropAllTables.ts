import {MigrationInterface, QueryRunner} from "typeorm";

export class DropAllTables1624800783193 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usercategory" DROP CONSTRAINT "FK_48944833ebc026696e0cdf81c7d"`);
        await queryRunner.query(`ALTER TABLE "usercategory" DROP CONSTRAINT "FK_92e199aac8f8615c5db8b75c1be"`);
        await queryRunner.query(`ALTER TABLE "charity" DROP CONSTRAINT "FK_74f0f6b810021d8b2cdc2f4879b"`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" DROP CONSTRAINT "FK_e543ef48668b94bcab67c0a30b5"`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" DROP CONSTRAINT "FK_13d372c451ebab36c6eb699257c"`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" DROP CONSTRAINT "FK_8fa969362a061757aa7650e8c18"`);
        await queryRunner.query(`ALTER TABLE "charitycategory" DROP CONSTRAINT "FK_6f7da4df064279a554fa80bee0e"`);
        await queryRunner.query(`ALTER TABLE "charitycategory" DROP CONSTRAINT "FK_c8a15f22777e66a419d1ac65b32"`);
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_9e91e6a24261b66f53971d3f96b"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_3acf7c55c319c4000e8056c1279"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_e8fb739f08d47955a39850fac23"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`DROP TABLE "usercategory"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "charity"`);
        await queryRunner.query(`DROP TABLE "charityrolelink"`);
        await queryRunner.query(`DROP TABLE "userrole"`);
        await queryRunner.query(`DROP TABLE "charitycategory"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "like"`);
    }

    public async down(_: QueryRunner): Promise<void> {
    }

}
