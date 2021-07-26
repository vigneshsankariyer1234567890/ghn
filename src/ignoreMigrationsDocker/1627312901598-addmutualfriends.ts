import {MigrationInterface, QueryRunner} from "typeorm";

export class addmutualfriends1627312901598 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
            CREATE OR REPLACE FUNCTION mutualfriends (
                p_user1id INT,
                p_user2id INT
              )
              returns table (
                uid int
              ) 
              language plpgsql
              as $$
              begin
              
              return query
                  select distinct a.uid from (
                      SELECT DISTINCT "user2Id" as uid from userfriend where "user1Id" = p_user1id and friendreqstatus = 'accepted'
                      UNION
                      SELECT DISTINCT "user1Id" as uid from userfriend where "user2Id" = p_user1id and friendreqstatus = 'accepted'
                  ) a inner join (
                      SELECT DISTINCT "user2Id" as uid from userfriend where "user1Id" = p_user2id and friendreqstatus = 'accepted'
                      UNION
                      SELECT DISTINCT "user1Id" as uid from userfriend where "user2Id" = p_user2id and friendreqstatus = 'accepted'	
                  ) b on a.uid = b.uid;
                  
              end;$$
            `
        )
    }

    public async down(_: QueryRunner): Promise<void> {
    }

}
