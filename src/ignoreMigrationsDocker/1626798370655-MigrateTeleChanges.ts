import {MigrationInterface, QueryRunner} from "typeorm";

export class MigrateTeleChanges1626798370655 implements MigrationInterface {
    name = 'MigrateTeleChanges1626798370655'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "charityfollow" RENAME COLUMN "udpatedAt" TO "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "userrole" RENAME COLUMN "udpatedAt" TO "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" RENAME COLUMN "udpatedAt" TO "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "category" RENAME COLUMN "udpatedAt" TO "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "charityprofile" ADD "contactNumber" text`)
        await queryRunner.query(`ALTER TABLE "charityprofile" ADD "email" text`)
        await queryRunner.query(`ALTER TABLE "event" ADD "telegramGroupId" text`)
        await queryRunner.query(`ALTER TABLE "event" ADD "telegramGroupHash" text`)
        await queryRunner.query(`ALTER TABLE "event" ADD "telegramGroupUpdatedDate" TIMESTAMP WITH TIME ZONE`)
        await queryRunner.query(`ALTER TABLE "eventvolunteer" ADD "joinedTelegram" boolean NOT NULL DEFAULT false`)
        await queryRunner.query(`ALTER TABLE "eventvolunteer" ADD "joinedTelegramDate" TIMESTAMP WITH TIME ZONE`)
        await queryRunner.query(`ALTER TABLE "charity" RENAME COLUMN "postalcode" TO "postalCode"`)
        await queryRunner.query(`ALTER TABLE "charity" RENAME COLUMN "udpatedAt" TO "updatedAt"`)
    }

    public async down(_: QueryRunner): Promise<void> {
       
    }

}
