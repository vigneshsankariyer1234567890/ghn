import { Arg, Ctx, FieldResolver, Int, Mutation, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { getConnection } from "typeorm";
import { Event } from "../entities/Event";
import { Eventlike } from "../entities/Eventlike";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { PaginatedEvents } from "../utils/cardContainers/EventInput";

@Resolver()
export class EventResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() event: Event) {
    return event.description.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() event: Event, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(event.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() event: Event,
    @Ctx() { eventLikeLoader, req }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }

    const like = await eventLikeLoader.load({
      cardId: event.id,
      userId: req.session.userId,
    });

    return like ? 1 : null;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async likeEvent(
    @Arg("eventId", () => Int) eventId: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;

    const like = await Eventlike.findOne({ where: { eventId, userId, auditstat:true } });

    // user has liked post before and unliking the post
    if (like) {
      await getConnection().transaction(async (tm) => {
        //to change later to auditStat = 10
        await tm.query(
          `
                update "eventlike" 
                set auditstat = false
                where id = $1
            `,
          [like.id]
        );

        await tm.query(
          `
                update event 
                set "likeNumber" = "likeNumber" - 1
                where id = $1
                and "likeNumber">0
            `,
          [eventId]
        );
      });
    } else if (!like) {
      //has never liked before
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
            insert into "eventlike" ("userId", "eventId")
            values ($1, $2)
          `,
          [userId, eventId]
        );

        await tm.query(
          `
                update event 
                set "likeNumber" = "likeNumber" + 1
                where id = $1
            `,
          [eventId]
        );
      });
    }
    return (like) ? false : true;
  }

  @Query(() => PaginatedEvents)
  async events(
    @Arg("limit", () => Int) limit: number,
    @Arg("sortByLikes") sortByLikes: boolean,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedEvents> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor))); //cursor null at first
    }

    // actual query
    const events = await getConnection().query(
      `
    select e.*
    from event p 

    ${cursor ? `where e."createdAt" < $2` : ""}
    order by 
        ${sortByLikes ? `e."likeNumber" DESC,` : ""} 
        e."createdAt" DESC
    limit $1
    `,
      replacements
    );

    return {
      events: events.slice(0, realLimit),
      hasMore: events.length === realLimitPlusOne,
    };
  }

  @Query(() => Event, { nullable: true })
  event(@Arg("id", () => Int) id: number): Promise<Event | undefined> {
    return Event.findOne(id);
  }

}
