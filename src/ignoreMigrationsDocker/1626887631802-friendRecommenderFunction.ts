import {MigrationInterface, QueryRunner} from "typeorm";

export class friendRecommenderFunction1626887631802 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `
            CREATE OR REPLACE FUNCTION friendRecommender (
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
		   		SELECT * FROM (
				   SELECT a.uid, MAX(row_number) as connections from (
					   SELECT a.uid, ROW_NUMBER() OVER (PARTITION BY a.uid ORDER BY a.uid) FROM (
						   SELECT DISTINCT xyz.uid FROM (
							   SELECT DISTINCT "user2Id" as uid from userfriend uf1 INNER JOIN (
								   SELECT DISTINCT "user2Id" as uid from userfriend where "user1Id" = p_userid and friendreqstatus = 'accepted'
								   UNION
								   SELECT DISTINCT "user1Id" as uid from userfriend where "user2Id" = p_userid and friendreqstatus = 'accepted'
							   ) b ON uf1."user1Id"=b.uid
							   where "user2Id" <> p_userid
							   UNION
							   SELECT DISTINCT "user1Id" as uid from userfriend a INNER JOIN (
								   SELECT DISTINCT "user2Id" as uid from userfriend where "user1Id" = p_userid and friendreqstatus = 'accepted'
								   UNION
								   SELECT DISTINCT "user1Id" as uid from userfriend where "user2Id" = p_userid and friendreqstatus = 'accepted'
							   ) b ON a."user2Id"=b.uid
							   where "user1Id" <> p_userid
						   ) xyz
					   )a inner join (
						   SELECT "userId", "categoryId" from usercategory where auditstat = true
					   ) b on a.uid = b."userId"
					   inner join (
						   SELECT "categoryId" FROM usercategory where "userId" = p_userid and auditstat = true
					   ) c on b."categoryId" = c."categoryId"
				   )a GROUP BY a.uid
				) a ORDER BY a.connections DESC LIMIT p_limit;
           end;$$
            `
        )
    }

    public async down(_: QueryRunner): Promise<void> {}

}
