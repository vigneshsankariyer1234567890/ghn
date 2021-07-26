import {MigrationInterface, QueryRunner} from "typeorm";

export class DropTablesAndFunctions1627301113522 implements MigrationInterface {
    name = 'DropTablesAndFunctions1627301113522'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP FUNCTION charityrecommender, friendrecommender, mutualfriends;`)
        await queryRunner.query(`ALTER TABLE "charitycategory" DROP CONSTRAINT "FK_6f7da4df064279a554fa80bee0e"`);
        await queryRunner.query(`ALTER TABLE "charitycategory" DROP CONSTRAINT "FK_c8a15f22777e66a419d1ac65b32"`);
        await queryRunner.query(`ALTER TABLE "charity" DROP CONSTRAINT "FK_74f0f6b810021d8b2cdc2f4879b"`);
        await queryRunner.query(`ALTER TABLE "charityprofile" DROP CONSTRAINT "FK_ad5f909c65ea62e8e71cfbaebb2"`);
        await queryRunner.query(`ALTER TABLE "charityfollow" DROP CONSTRAINT "FK_5221aa72bb7a692dc18b45d7647"`);
        await queryRunner.query(`ALTER TABLE "charityfollow" DROP CONSTRAINT "FK_9fcc050556f79deb59bca0503fe"`);
        await queryRunner.query(`ALTER TABLE "userprofile" DROP CONSTRAINT "FK_fc505bba393243cf1910fca131d"`);
        await queryRunner.query(`ALTER TABLE "userfriend" DROP CONSTRAINT "FK_ec9adf62dea428b22fdde123270"`);
        await queryRunner.query(`ALTER TABLE "userfriend" DROP CONSTRAINT "FK_912aab0508f02a0a8d8d2d5a3c3"`);
        await queryRunner.query(`ALTER TABLE "usercategory" DROP CONSTRAINT "FK_48944833ebc026696e0cdf81c7d"`);
        await queryRunner.query(`ALTER TABLE "usercategory" DROP CONSTRAINT "FK_92e199aac8f8615c5db8b75c1be"`);
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_9e91e6a24261b66f53971d3f96b"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_94a85bb16d24033a2afdd5df060"`);
        await queryRunner.query(`ALTER TABLE "comment" DROP CONSTRAINT "FK_276779da446413a0d79598d4fbd"`);
        await queryRunner.query(`ALTER TABLE "posteventlink" DROP CONSTRAINT "FK_8e2093670c3797a3d33d7c13d0f"`);
        await queryRunner.query(`ALTER TABLE "posteventlink" DROP CONSTRAINT "FK_e253bc4e1dedeb492320918f827"`);
        await queryRunner.query(`ALTER TABLE "posteventlink" DROP CONSTRAINT "FK_fb1b747b21b36ca00d08fdac068"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_7a773352fcf1271324f2e5a3e41"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_d1ae8a8c3e31ab31f362cd45baf"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_46bcf7c0773a6ce029ea42be59f"`);
        await queryRunner.query(`ALTER TABLE "taskvolunteer" DROP CONSTRAINT "FK_702c9ebb17d05357aca05e2c53a"`);
        await queryRunner.query(`ALTER TABLE "taskvolunteer" DROP CONSTRAINT "FK_e480ef3eb437fefc70db271c80d"`);
        await queryRunner.query(`ALTER TABLE "eventvolunteer" DROP CONSTRAINT "FK_f4514688a2ebe196513fda78763"`);
        await queryRunner.query(`ALTER TABLE "eventvolunteer" DROP CONSTRAINT "FK_95b9c09cab017facc2fae46b8a3"`);
        await queryRunner.query(`ALTER TABLE "eventvolunteer" DROP CONSTRAINT "FK_b3d4c2b9aee5809bdba3fc196fd"`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" DROP CONSTRAINT "FK_e543ef48668b94bcab67c0a30b5"`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" DROP CONSTRAINT "FK_13d372c451ebab36c6eb699257c"`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" DROP CONSTRAINT "FK_8fa969362a061757aa7650e8c18"`);
        await queryRunner.query(`ALTER TABLE "eventlike" DROP CONSTRAINT "FK_9a047684889dffdc07bbb8ef0df"`);
        await queryRunner.query(`ALTER TABLE "eventlike" DROP CONSTRAINT "FK_0ad234fcb04d46678f327242d80"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_3acf7c55c319c4000e8056c1279"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_e8fb739f08d47955a39850fac23"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`DROP TABLE "charitycategory"`);
        await queryRunner.query(`DROP TABLE "charity"`);
        await queryRunner.query(`DROP TABLE "charityprofile"`);
        await queryRunner.query(`DROP TABLE "charityfollow"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "userprofile"`);
        await queryRunner.query(`DROP TYPE "userprofile_gender_enum"`);
        await queryRunner.query(`DROP TABLE "userfriend"`);
        await queryRunner.query(`DROP TYPE "userfriend_friendreqstatus_enum"`);
        await queryRunner.query(`DROP TABLE "usercategory"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "comment"`);
        await queryRunner.query(`DROP TABLE "posteventlink"`);
        await queryRunner.query(`DROP TABLE "event"`);
        await queryRunner.query(`DROP TABLE "task"`);
        await queryRunner.query(`DROP TYPE "task_completionstatus_enum"`);
        await queryRunner.query(`DROP TABLE "taskvolunteer"`);
        await queryRunner.query(`DROP TABLE "eventvolunteer"`);
        await queryRunner.query(`DROP TYPE "eventvolunteer_adminapproval_enum"`);
        await queryRunner.query(`DROP TABLE "userrole"`);
        await queryRunner.query(`DROP TABLE "charityrolelink"`);
        await queryRunner.query(`DROP TABLE "eventlike"`);
        await queryRunner.query(`DROP TABLE "like"`);
    }

    public async down(_: QueryRunner): Promise<void> {}

}
