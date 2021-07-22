import {MigrationInterface, QueryRunner} from "typeorm";

export class charityRecommenderFunction1626888852375 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        CREATE OR REPLACE FUNCTION charityRecommender (
            p_userid INT,
            p_limit INT
       )
       returns table (
            uid int, connections bigint
       ) 
       language plpgsql
       as $$
       begin
       
       return query
           select a.cid, MAX(a.row_number) as connections from (
               select a.cid, ROW_NUMBER() OVER (PARTITION BY a.cid ORDER BY a.cid) from (
                   select a.uid, cf."charityId" as cid from (
                       SELECT DISTINCT "user2Id" as uid from userfriend where "user1Id" = p_userid and friendreqstatus = 'accepted'
                       UNION
                       SELECT DISTINCT "user1Id" as uid from userfriend where "user2Id" = p_userid and friendreqstatus = 'accepted'
                   ) a inner join charityfollow cf on cf."userId" = a.uid and auditstat = true
               ) a inner join(
                   select "charityId" as cid from charityfollow cf where cf."userId" = p_userid and auditstat = true
               ) b on a.cid = b.cid
           ) a GROUP BY (a.cid) LIMIT p_limit;
       
       end;$$
        `)
    }

    public async down(_: QueryRunner): Promise<void> {}

}
