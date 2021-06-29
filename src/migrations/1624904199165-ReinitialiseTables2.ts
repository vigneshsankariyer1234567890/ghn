import {MigrationInterface, QueryRunner} from "typeorm";

export class ReinitialiseTables21624904199165 implements MigrationInterface {
    name = 'ReinitialiseTables21624904199165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "like" ("userId" integer NOT NULL, "postId" integer NOT NULL, CONSTRAINT "PK_78a9f4a1b09b6d2bf7ed85f252f" PRIMARY KEY ("userId", "postId"))`);
        await queryRunner.query(`CREATE TABLE "charitycategory" ("id" SERIAL NOT NULL, "charityId" integer NOT NULL, "categoryId" integer NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_951d8cc3c18363a29fd2c545700" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "charityfollow" ("id" SERIAL NOT NULL, "charityId" integer NOT NULL, "userId" integer NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "udpatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7022780bcc7e23235c945e9a65f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "eventlike" ("userId" integer NOT NULL, "eventId" integer NOT NULL, CONSTRAINT "PK_e5270074c12c7736c143f5996f2" PRIMARY KEY ("userId", "eventId"))`);
        await queryRunner.query(`CREATE TABLE "taskvolunteer" ("id" SERIAL NOT NULL, "taskId" integer NOT NULL, "userId" integer NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_5849efc4bdd687c5cb3690752b1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "task_completionstatus_enum" AS ENUM('completed', 'new', 'active', 'resolved')`);
        await queryRunner.query(`CREATE TABLE "task" ("id" SERIAL NOT NULL, "eventId" integer NOT NULL, "description" text NOT NULL, "deadline" TIMESTAMP NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, "completionstatus" "task_completionstatus_enum" NOT NULL DEFAULT 'new', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "event" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "dateStart" TIMESTAMP NOT NULL, "dateEnd" TIMESTAMP NOT NULL, "venue" text NOT NULL DEFAULT '', "charityId" integer NOT NULL, "creatorId" integer NOT NULL, "likeNumber" integer NOT NULL DEFAULT '0', "completed" boolean NOT NULL DEFAULT false, "auditstat" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_30c2f3bbaf6d34a55f8ae6e4614" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "eventvolunteer_adminapproval_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`CREATE TABLE "eventvolunteer" ("id" SERIAL NOT NULL, "eventId" integer NOT NULL, "userId" integer NOT NULL, "adminapproval" "eventvolunteer_adminapproval_enum" NOT NULL DEFAULT 'pending', "userroleId" integer NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, "volunteeringCompleted" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_344280cbed72a704dc244309582" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "userrole" ("id" SERIAL NOT NULL, "roleName" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "udpatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4f773b34499eded638ce5fe26b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "charityrolelink" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "userroleId" integer NOT NULL, "charityId" integer NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "udpatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_aa01b2baf292aea1f2d6404ff3e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "charity" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "uen" character varying NOT NULL, "physicalAddress" character varying NOT NULL, "postalcode" character varying NOT NULL, "charitycreatorId" integer NOT NULL, "followNumber" integer NOT NULL DEFAULT '0', "auditstat" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "udpatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ac5d5f85641be5b68ace6a50a0b" UNIQUE ("name"), CONSTRAINT "UQ_ebcf3afeb44ae7b5e59237e4c14" UNIQUE ("uen"), CONSTRAINT "PK_fbdd8ba5b5a6504618b8b1ab295" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "posteventlink" ("id" SERIAL NOT NULL, "eventId" integer NOT NULL, "eventName" character varying NOT NULL, "charityId" integer NOT NULL, "postId" integer NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_fabd41ad16dad239c685accee83" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "text" character varying NOT NULL, "likeNumber" integer NOT NULL DEFAULT '0', "creatorId" integer NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, "isEvent" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "usercategory" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "categoryId" integer NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_322f5c6d8f5db6c4da201fd727f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "category" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "udpatedAt" TIMESTAMP NOT NULL DEFAULT now(), "auditstat" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_e8fb739f08d47955a39850fac23" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_3acf7c55c319c4000e8056c1279" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charitycategory" ADD CONSTRAINT "FK_c8a15f22777e66a419d1ac65b32" FOREIGN KEY ("charityId") REFERENCES "charity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charitycategory" ADD CONSTRAINT "FK_6f7da4df064279a554fa80bee0e" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charityfollow" ADD CONSTRAINT "FK_9fcc050556f79deb59bca0503fe" FOREIGN KEY ("charityId") REFERENCES "charity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charityfollow" ADD CONSTRAINT "FK_5221aa72bb7a692dc18b45d7647" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "eventlike" ADD CONSTRAINT "FK_0ad234fcb04d46678f327242d80" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "eventlike" ADD CONSTRAINT "FK_9a047684889dffdc07bbb8ef0df" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "taskvolunteer" ADD CONSTRAINT "FK_e480ef3eb437fefc70db271c80d" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "taskvolunteer" ADD CONSTRAINT "FK_702c9ebb17d05357aca05e2c53a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_46bcf7c0773a6ce029ea42be59f" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_d1ae8a8c3e31ab31f362cd45baf" FOREIGN KEY ("charityId") REFERENCES "charity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_7a773352fcf1271324f2e5a3e41" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "eventvolunteer" ADD CONSTRAINT "FK_b3d4c2b9aee5809bdba3fc196fd" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "eventvolunteer" ADD CONSTRAINT "FK_95b9c09cab017facc2fae46b8a3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "eventvolunteer" ADD CONSTRAINT "FK_f4514688a2ebe196513fda78763" FOREIGN KEY ("userroleId") REFERENCES "userrole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" ADD CONSTRAINT "FK_8fa969362a061757aa7650e8c18" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" ADD CONSTRAINT "FK_13d372c451ebab36c6eb699257c" FOREIGN KEY ("userroleId") REFERENCES "userrole"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" ADD CONSTRAINT "FK_e543ef48668b94bcab67c0a30b5" FOREIGN KEY ("charityId") REFERENCES "charity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charity" ADD CONSTRAINT "FK_74f0f6b810021d8b2cdc2f4879b" FOREIGN KEY ("charitycreatorId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posteventlink" ADD CONSTRAINT "FK_fb1b747b21b36ca00d08fdac068" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posteventlink" ADD CONSTRAINT "FK_e253bc4e1dedeb492320918f827" FOREIGN KEY ("charityId") REFERENCES "charity"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "posteventlink" ADD CONSTRAINT "FK_8e2093670c3797a3d33d7c13d0f" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_9e91e6a24261b66f53971d3f96b" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usercategory" ADD CONSTRAINT "FK_92e199aac8f8615c5db8b75c1be" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usercategory" ADD CONSTRAINT "FK_48944833ebc026696e0cdf81c7d" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usercategory" DROP CONSTRAINT "FK_48944833ebc026696e0cdf81c7d"`);
        await queryRunner.query(`ALTER TABLE "usercategory" DROP CONSTRAINT "FK_92e199aac8f8615c5db8b75c1be"`);
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_9e91e6a24261b66f53971d3f96b"`);
        await queryRunner.query(`ALTER TABLE "posteventlink" DROP CONSTRAINT "FK_8e2093670c3797a3d33d7c13d0f"`);
        await queryRunner.query(`ALTER TABLE "posteventlink" DROP CONSTRAINT "FK_e253bc4e1dedeb492320918f827"`);
        await queryRunner.query(`ALTER TABLE "posteventlink" DROP CONSTRAINT "FK_fb1b747b21b36ca00d08fdac068"`);
        await queryRunner.query(`ALTER TABLE "charity" DROP CONSTRAINT "FK_74f0f6b810021d8b2cdc2f4879b"`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" DROP CONSTRAINT "FK_e543ef48668b94bcab67c0a30b5"`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" DROP CONSTRAINT "FK_13d372c451ebab36c6eb699257c"`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" DROP CONSTRAINT "FK_8fa969362a061757aa7650e8c18"`);
        await queryRunner.query(`ALTER TABLE "eventvolunteer" DROP CONSTRAINT "FK_f4514688a2ebe196513fda78763"`);
        await queryRunner.query(`ALTER TABLE "eventvolunteer" DROP CONSTRAINT "FK_95b9c09cab017facc2fae46b8a3"`);
        await queryRunner.query(`ALTER TABLE "eventvolunteer" DROP CONSTRAINT "FK_b3d4c2b9aee5809bdba3fc196fd"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_7a773352fcf1271324f2e5a3e41"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_d1ae8a8c3e31ab31f362cd45baf"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_46bcf7c0773a6ce029ea42be59f"`);
        await queryRunner.query(`ALTER TABLE "taskvolunteer" DROP CONSTRAINT "FK_702c9ebb17d05357aca05e2c53a"`);
        await queryRunner.query(`ALTER TABLE "taskvolunteer" DROP CONSTRAINT "FK_e480ef3eb437fefc70db271c80d"`);
        await queryRunner.query(`ALTER TABLE "eventlike" DROP CONSTRAINT "FK_9a047684889dffdc07bbb8ef0df"`);
        await queryRunner.query(`ALTER TABLE "eventlike" DROP CONSTRAINT "FK_0ad234fcb04d46678f327242d80"`);
        await queryRunner.query(`ALTER TABLE "charityfollow" DROP CONSTRAINT "FK_5221aa72bb7a692dc18b45d7647"`);
        await queryRunner.query(`ALTER TABLE "charityfollow" DROP CONSTRAINT "FK_9fcc050556f79deb59bca0503fe"`);
        await queryRunner.query(`ALTER TABLE "charitycategory" DROP CONSTRAINT "FK_6f7da4df064279a554fa80bee0e"`);
        await queryRunner.query(`ALTER TABLE "charitycategory" DROP CONSTRAINT "FK_c8a15f22777e66a419d1ac65b32"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_3acf7c55c319c4000e8056c1279"`);
        await queryRunner.query(`ALTER TABLE "like" DROP CONSTRAINT "FK_e8fb739f08d47955a39850fac23"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`DROP TABLE "usercategory"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "posteventlink"`);
        await queryRunner.query(`DROP TABLE "charity"`);
        await queryRunner.query(`DROP TABLE "charityrolelink"`);
        await queryRunner.query(`DROP TABLE "userrole"`);
        await queryRunner.query(`DROP TABLE "eventvolunteer"`);
        await queryRunner.query(`DROP TYPE "eventvolunteer_adminapproval_enum"`);
        await queryRunner.query(`DROP TABLE "event"`);
        await queryRunner.query(`DROP TABLE "task"`);
        await queryRunner.query(`DROP TYPE "task_completionstatus_enum"`);
        await queryRunner.query(`DROP TABLE "taskvolunteer"`);
        await queryRunner.query(`DROP TABLE "eventlike"`);
        await queryRunner.query(`DROP TABLE "charityfollow"`);
        await queryRunner.query(`DROP TABLE "charitycategory"`);
        await queryRunner.query(`DROP TABLE "like"`);
    }

}
