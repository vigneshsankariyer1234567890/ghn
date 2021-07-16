import {MigrationInterface, QueryRunner} from "typeorm";

export class AddingFriendsTable1626253088374 implements MigrationInterface {
    name = 'AddingFriendsTable1626253088374'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "userfriend_friendreqstatus_enum" AS ENUM('user1_req', 'user2_req', 'accepted', 'rejected', 'blocked_user1', 'blocked_user2')`);
        await queryRunner.query(`CREATE TABLE "userfriend" ("id" SERIAL NOT NULL, "user1Id" integer NOT NULL, "user2Id" integer NOT NULL, "friendreqstatus" "userfriend_friendreqstatus_enum" NOT NULL DEFAULT 'accepted', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "CHK_b674213e5865e501a04602b7d1" CHECK ("user1Id" < "user2Id"), CONSTRAINT "PK_554b9586708ac1e1498ff75acf7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "userfriend" ADD CONSTRAINT "FK_912aab0508f02a0a8d8d2d5a3c3" FOREIGN KEY ("user1Id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "userfriend" ADD CONSTRAINT "FK_ec9adf62dea428b22fdde123270" FOREIGN KEY ("user2Id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "userfriend" DROP CONSTRAINT "FK_ec9adf62dea428b22fdde123270"`);
        await queryRunner.query(`ALTER TABLE "userfriend" DROP CONSTRAINT "FK_912aab0508f02a0a8d8d2d5a3c3"`);
        await queryRunner.query(`DROP TABLE "userfriend"`);
        await queryRunner.query(`DROP TYPE "userfriend_friendreqstatus_enum"`);
        
    }

}
