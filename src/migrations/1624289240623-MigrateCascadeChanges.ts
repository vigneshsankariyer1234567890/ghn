import {MigrationInterface, QueryRunner} from "typeorm";

export class MigrateCascadeChanges1624289240623 implements MigrationInterface {
    name = 'MigrateCascadeChanges1624289240623'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // await queryRunner.query(`CREATE TABLE "like" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "postId" integer NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_323753af831bf3178ffcf217ecc" PRIMARY KEY ("id", "userId", "postId"))`);
        // await queryRunner.query(`CREATE TABLE "post" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "text" character varying NOT NULL, "likeNumber" integer NOT NULL DEFAULT '0', "creatorId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "charitycategory" ("id" SERIAL NOT NULL, "charityId" integer NOT NULL, "categoryId" integer NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_951d8cc3c18363a29fd2c545700" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "userrole" ("id" SERIAL NOT NULL, "roleName" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "udpatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4f773b34499eded638ce5fe26b" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "charityrolelink" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "userroleId" integer NOT NULL, "charityId" integer NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "udpatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_aa01b2baf292aea1f2d6404ff3e" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "charity" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "uen" character varying NOT NULL, "physicalAddress" character varying NOT NULL, "postalcode" character varying NOT NULL, "charitycreatorId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "udpatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_ac5d5f85641be5b68ace6a50a0b" UNIQUE ("name"), CONSTRAINT "UQ_ebcf3afeb44ae7b5e59237e4c14" UNIQUE ("uen"), CONSTRAINT "PK_fbdd8ba5b5a6504618b8b1ab295" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "email" character varying NOT NULL, "password" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "usercategory" ("id" SERIAL NOT NULL, "userId" integer NOT NULL, "categoryId" integer NOT NULL, "auditstat" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_322f5c6d8f5db6c4da201fd727f" PRIMARY KEY ("id"))`);
        // await queryRunner.query(`CREATE TABLE "category" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "udpatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9c4e4a89e3674fc9f382d733f03" PRIMARY KEY ("id"))`);

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

        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_e8fb739f08d47955a39850fac23" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like" ADD CONSTRAINT "FK_3acf7c55c319c4000e8056c1279" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_9e91e6a24261b66f53971d3f96b" FOREIGN KEY ("creatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charitycategory" ADD CONSTRAINT "FK_c8a15f22777e66a419d1ac65b32" FOREIGN KEY ("charityId") REFERENCES "charity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charitycategory" ADD CONSTRAINT "FK_6f7da4df064279a554fa80bee0e" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" ADD CONSTRAINT "FK_8fa969362a061757aa7650e8c18" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" ADD CONSTRAINT "FK_13d372c451ebab36c6eb699257c" FOREIGN KEY ("userroleId") REFERENCES "userrole"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charityrolelink" ADD CONSTRAINT "FK_e543ef48668b94bcab67c0a30b5" FOREIGN KEY ("charityId") REFERENCES "charity"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "charity" ADD CONSTRAINT "FK_74f0f6b810021d8b2cdc2f4879b" FOREIGN KEY ("charitycreatorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usercategory" ADD CONSTRAINT "FK_92e199aac8f8615c5db8b75c1be" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usercategory" ADD CONSTRAINT "FK_48944833ebc026696e0cdf81c7d" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
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
        // await queryRunner.query(`DROP TABLE "category"`);
        // await queryRunner.query(`DROP TABLE "usercategory"`);
        // await queryRunner.query(`DROP TABLE "user"`);
        // await queryRunner.query(`DROP TABLE "charity"`);
        // await queryRunner.query(`DROP TABLE "charityrolelink"`);
        // await queryRunner.query(`DROP TABLE "userrole"`);
        // await queryRunner.query(`DROP TABLE "charitycategory"`);
        // await queryRunner.query(`DROP TABLE "post"`);
        // await queryRunner.query(`DROP TABLE "like"`);
    }

}
