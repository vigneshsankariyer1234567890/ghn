import {MigrationInterface, QueryRunner} from "typeorm";

export class CharityRecommender21627301722665 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
        CREATE OR REPLACE FUNCTION charityrecommender(
            p_userid integer,
            p_limit integer)
            RETURNS TABLE(uid integer, connections bigint) 
            LANGUAGE 'plpgsql'
        
        AS $BODY$
        begin
               
               return query
                   select a.id, MAX(a.row_number) as connections from (
            select c.id, ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY c.id) from (
                select distinct c.id from (
                    select c.*, cc."categoryId" from charity c inner join charitycategory cc 
                    on c.id = cc."charityId"
                    where cc.auditstat = true
                ) c
                left outer join usercategory uc on uc."categoryId" = c."categoryId"
                where uc.auditstat = true and uc."userId" = p_userid
            ) c left outer join charityfollow cf on c.id = cf."charityId" and cf.auditstat = true
        ) a group by (a.id) order by connections DESC LIMIT p_limit;
               
               end;
        $BODY$;
        `)
    }

    public async down(_: QueryRunner): Promise<void> {
    }

}
