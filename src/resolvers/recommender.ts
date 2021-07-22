import { Arg, Ctx, Query, Resolver, UseMiddleware } from "type-graphql";
import { getConnection } from "typeorm";
import { Charity } from "../entities/Charity";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { PaginatedCharities, PaginatedUsers } from "../utils/cardContainers/PaginatedCharitiesAndUsers";

@Resolver()
export class RecommenderResolver {

    @Query(() => PaginatedUsers)
    @UseMiddleware(isAuth)
    async userRecommender(
        @Arg("limit") limit: number,
        @Ctx() { req }: MyContext
    ): Promise<PaginatedUsers> {

        if (!req.session.userId) {
            return {
                items: [],
                total: 0,
                hasMore: false
            }
        }

        const rawUserConnections = await getConnection().query(
            `
            select * from friendrecommender($1, $2)
            `, [req.session.userId, limit]
        ).then(a => {return a.map(u => u.uid)});

        const users = await User.findByIds(rawUserConnections);

        return {
            items: users,
            total: users.length,
            hasMore: false
        }
    }

    @Query(() => PaginatedCharities)
    @UseMiddleware(isAuth)
    async charityRecommender(
        @Arg("limit") limit: number,
        @Ctx() { req }: MyContext
    ): Promise<PaginatedCharities> {

        if (!req.session.userId) {
            return {
                items: [],
                total: 0,
                hasMore: false
            }
        }

        const rawCharityConnections = await getConnection().query(
            `
            select * from charityrecommender($1, $2)
            `, [req.session.userId, limit]
        ).then(a => {return a.map(u => u.uid)});

        const charities = await Charity.findByIds(rawCharityConnections);

        return {
            items: charities,
            total: charities.length,
            hasMore: false
        }    
    }


}