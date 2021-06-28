import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Charityrolelink } from "../entities/Charityrolelink";
import { Event } from "../entities/Event";
import { Eventlike } from "../entities/Eventlike";
import { Posteventlink } from "../entities/Posteventlink";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import {
  EventInput,
  PaginatedEvents,
} from "../utils/cardContainers/EventInput";
import { FieldError } from "./user";
import { deletePosts } from "./post";
import { Task, TaskCompletionStatus } from "../entities/Task";
import { Charity } from "../entities/Charity";
import { EPost, PostInput } from "../utils/cardContainers/PostInput";
import { Post } from "../entities/Post";
import { AdminApproval, Eventvolunteer } from "../entities/Eventvolunteer";
import { Taskvolunteer } from "../entities/Taskvolunteer";

@ObjectType()
export class EventResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Event, { nullable: true })
  event?: Event;

  @Field(() => Boolean, { nullable: true })
  success!: boolean;
}

@ObjectType()
class EventPostResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => EPost, { nullable: true })
  epost?: EPost;

  @Field(() => Boolean, { nullable: true })
  success!: boolean;
}

@Resolver(Event)
export class EventResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() event: Event) {
    return event.description.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() event: Event, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(event.creatorId);
  }

  @FieldResolver(() => Charity)
  charity(@Root() event: Event, @Ctx() { charityLoader }: MyContext) {
    return charityLoader.load(event.charityId);
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
      eventId: event.id,
      userId: req.session.userId,
    });

    return like ? 1 : null;
  }

  @FieldResolver(() => String, { nullable: true })
  async approvalStatus(
    @Root() event: Event,
    @Ctx() { req }: MyContext
  ): Promise<string | null> {
    if (!req.session.userId) {
      return null;
    }

    const ev = await Eventvolunteer.findOne({
      where: { eventId: event.id, userId: req.session.userId, auditstat: true },
    });

    if (!ev) {
      return null;
    }

    return ev.adminapproval;
  }

  @FieldResolver(() => [User], { nullable: true })
  async currentEventVolunteers(
    @Root() event: Event,
    @Ctx() { req }: MyContext
  ): Promise<User[] | null> {
    if (!req.session.userId) {
      return null;
    }

    return await getConnection()
      .createQueryBuilder()
      .select(`u.*`)
      .from(Event, `ev`)
      .innerJoin(Eventvolunteer, `v`, `ev.id = v."eventId"`)
      .innerJoin(User, `u`, `v."userId" = u.id`)
      .where(`v.adminapproval = 'approved'`)
      .andWhere(`v.auditstat = true`)
      .andWhere(`ev.id = :eid`, { eid: event.id })
      .getRawMany<User>();
  }

  @FieldResolver(() => [Task], { nullable: true })
  async eventTasks(
    @Root() event: Event,
    @Ctx() { req }: MyContext
  ): Promise<Task[] | null> {
    if (!req.session.userId) {
      return null;
    }

    if (event.completed) {
      return null;
    }

    const checkvolunteer = await Eventvolunteer.findOne({
      where: {
        eventId: event.id,
        userId: req.session.userId,
        auditstat: true,
        adminapproval: AdminApproval.APPROVED,
      },
    });

    if (!checkvolunteer) {
      return null;
    }

    return await Task.find({
      where: {
        eventId: event.id,
        auditstat: true,
      },
    });
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async likeEvent(
    @Arg("eventId", () => Int) eventId: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;

    const like = await Eventlike.findOne({
      where: { eventId: eventId, userId: userId },
    });

    // user has liked post before and unliking the post
    if (like) {
      await getConnection().transaction(async (tm) => {
        await tm.delete(Eventlike, { userId: userId, eventId: eventId });

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
        await tm
          .createQueryBuilder()
          .insert()
          .into(Eventlike)
          .values({ userId: userId, eventId: eventId })
          .execute();

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
    return like ? false : true;
  }

  @Query(() => PaginatedEvents)
  async events(
    @Arg("limit", () => Int) limit: number,
    @Arg("sortByLikes") sortByLikes: boolean,
    @Arg("sortByUpcoming") sortByUpcoming: boolean,
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
    from event e 
    where e.auditstat = TRUE
    ${cursor ? `and e."updatedAt" < $2` : ""}
    order by 
        ${sortByUpcoming ? `e."dateStart" DESC,` : ""}
        ${sortByLikes ? `e."likeNumber" DESC,` : ""} 
        e."dateStart" DESC
    limit $1
    `,
      replacements
    );

    return {
      events: events.slice(0, realLimit),
      hasMore: events.length === realLimitPlusOne,
    };
  }

  @Query(() => PaginatedEvents)
  async eventsByCategories(
    @Arg("limit", () => Int) limit: number,
    @Arg("sortByLikes") sortByLikes: boolean,
    @Arg("sortByUpcoming") sortByUpcoming: boolean,
    @Arg("categories", () => [Number]) categories: number[],
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedEvents> {

    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];

    const catcsv = categories
        .reduce<string>((a, b) => a + b + `,`, ``)
        .slice(0, -1);
    replacements.push(catcsv);

    if (cursor) {
      replacements.push(new Date(parseInt(cursor))); //cursor null at first
    }

    // actual query
    const events = await getConnection().query(
      `
      SELECT ev.* FROM (
        SELECT DISTINCT char.* 
        FROM charitycategory cc
        INNER JOIN 
        (SELECT id FROM unnest(string_to_array( $2, ',')::int[]) AS id
        ) cat
        ON cat.id = cc."categoryId"
        FULL JOIN charity char ON char.id = cc."charityId"
        WHERE cc.auditstat = TRUE
      ) charities
      inner join event ev on charities.id = ev."charityId"
      where ev.auditstat = TRUE
      ${cursor ? `and ev."updatedAt" < $3` : ""}
      order by 
        ${sortByUpcoming ? `ev."dateStart" DESC,` : ""}
        ${sortByLikes ? `ev."likeNumber" DESC,` : ""} 
        ev."dateStart" DESC
      limit $1;
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

  @Mutation(() => EventResponse)
  @UseMiddleware(isAuth)
  async createEvent(
    @Arg("input") input: EventInput,
    @Arg("charityId", () => Number) charityId: number,
    @Ctx() { req }: MyContext
  ): Promise<EventResponse> {
    if (!req.session.userId) {
      return {
        errors: [
          {
            field: "User",
            message: "User is not authenticated.",
          },
        ],
        success: false,
      };
    }

    if (!req.session.charityAdminIds) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    const adids = req.session.charityAdminIds.filter((i) => i === charityId);

    if (adids.length === 0) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    const char = charityId;

    // create event in db
    const event = await Event.create({
      // ...input,
      name: input.name,
      description: input.description,
      dateStart: input.dateStart,
      dateEnd: input.dateEnd,
      venue: input.venue ? input.venue : "",
      charityId: char,
      creatorId: req.session.userId,
    }).save();
    // add admin as event volunteer

    const ads = await Charityrolelink.find({ where: { charityId: charityId } });
    const mapped = ads
      .map((crl) => crl.userId)
      .reduce<string>((a, b) => a + b + `,`, ``)
      .slice(0, -1);
    console.log(mapped);
    await getConnection().transaction(async (tm) => {
      await tm.query(
        `
        insert into eventvolunteer("eventId", "userId", adminapproval, "userroleId")
        select $1 as eventid, unnest(string_to_array($2,',')::int[]) as userId, 'approved' as adm, 1 as uri
        `,
        [event.id, mapped]
      );
    });

    // return event
    return { event: event, success: true };
  }

  @Mutation(() => EventResponse)
  @UseMiddleware(isAuth)
  async updateEvent(
    @Arg("id") id: number,
    @Arg("input") input: EventInput,
    @Ctx() { req }: MyContext
  ): Promise<EventResponse> {
    if (!req.session.userId) {
      return {
        errors: [
          {
            field: "User",
            message: "User is not authenticated.",
          },
        ],
        success: false,
      };
    }

    const ev = await Event.findOne({ where: { id: id, auditstat: true } });

    if (!ev) {
      return {
        errors: [
          {
            field: "Event",
            message: "That event does not exist.",
          },
        ],
        success: false,
      };
    }

    const charityId = ev.charityId;

    if (!req.session.charityAdminIds) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    const adids = req.session.charityAdminIds.filter((i) => i === charityId);

    if (adids.length === 0) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    const result = await getConnection()
      .createQueryBuilder()
      .update(Event)
      .set({
        name: input.name,
        description: input.description,
        dateStart: input.dateStart,
        dateEnd: input.dateEnd,
        venue: input.venue ? input.venue : ev.venue,
      })
      .where('id = :id and "charityId" = :charityId and auditstat=true', {
        id,
        charityId: charityId,
      })
      .returning("*")
      .execute();

    return { event: result.raw[0], success: true };
  }

  @Mutation(() => EventResponse)
  @UseMiddleware(isAuth)
  async deleteEvent(
    @Arg("id") id: number,
    @Ctx() { req }: MyContext
  ): Promise<EventResponse> {
    // check credentials
    if (!req.session.userId) {
      return {
        errors: [
          {
            field: "User",
            message: "User is not authenticated.",
          },
        ],
        success: false,
      };
    }

    if (!req.session.charityAdminIds) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    const ev = await Event.findOne({ where: { id: id, auditstat: true } });

    if (!ev) {
      return {
        errors: [
          {
            field: "Event",
            message: "That event does not exist.",
          },
        ],
        success: false,
      };
    }

    const charityId = ev.charityId;

    const adids = req.session.charityAdminIds.filter((i) => i === charityId);

    if (adids.length === 0) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    // if credentials are satisfied, mark event as deleted
    try {
      await getConnection().transaction(async (tm) => {
        tm.query(
          `
        update event 
        set auditstat = false
        where id = $1
        `,
          [id]
        );
      });

      // mark Eventlikes as deleted

      await getConnection().transaction(async (tm) => {
        await tm
          .createQueryBuilder()
          .delete()
          .from(Eventlike, `el`)
          .where(`el."eventId" :event`, { event: id })
          .execute();
      });

      // get list of posteventlinks which are about event

      const pels = await Posteventlink.find({ where: { eventId: id } });
      const postkeys = pels.map((pe) => pe.postId);

      // mark posts which are about event
      await deletePosts(postkeys);

      // mark Eventvolunteers as deleted
      await getConnection().transaction(async (tm) => {
        tm.query(
          `
        update eventvolunteer 
        set auditstat = false
        where "eventId" = $1
        `,
          [id]
        );
      });

      // mark Tasks as deleted
      const tasks = await Task.find({
        where: { eventId: id, auditstat: true },
      });
      const taskkeys = tasks.map((pe) => pe.eventId);

      await getConnection().transaction(async (tm) => {
        tm.query(
          `
        update task 
        set auditstat = false
        where "eventId" = $1
        `,
          [id]
        );
      });

      await getConnection().transaction(async (tm) => {
        tm.query(
          `
        UPDATE taskvolunteer AS ev 
        SET auditstat = false
        FROM (select unnest(string_to_array($1,',')::int[]) as taskId ) AS tid
        WHERE ev."taskId" = tid.taskId
        `,
          [taskkeys.reduce<string>((a, b) => a + b + `,`, ``).slice(0, -1)]
        );
      });
    } catch (err) {
      console.log(err);
      return {
        errors: [{ field: "DB error", message: "Please check the database." }],
        success: false,
      };
    }

    // mark Taskvolunteers as deleted
    return { success: true };
  }

  @Mutation(() => EventPostResponse)
  @UseMiddleware(isAuth)
  async shareEvent(
    @Arg("id") id: number,
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<EventPostResponse> {
    if (!req.session.userId) {
      return {
        errors: [
          {
            field: "User",
            message: "User is not authenticated.",
          },
        ],
        success: false,
      };
    }

    const ev = await Event.findOne({ where: { id: id, auditstat: true } });

    if (!ev) {
      return {
        errors: [
          {
            field: "Event",
            message: "That event does not exist.",
          },
        ],
        success: false,
      };
    }

    const post = await Post.create({
      ...input,
      isEvent: true,
      creatorId: req.session.userId,
    }).save();

    const pel = await Posteventlink.create({
      eventId: ev.id,
      eventName: ev.name,
      charityId: ev.charityId,
      postId: post.id,
    }).save();

    const epost: EPost = {
      post: post,
      isEvent: true,
      eventId: pel.eventId,
      eventName: pel.eventName,
    };

    return { success: true, epost: epost };
  }

  @UseMiddleware(isAuth)
  @Mutation(() => EventResponse)
  async markEventAsComplete(
    @Arg("id") id: number,
    @Ctx() { req }: MyContext
  ): Promise<EventResponse> {
    // check credentials

    if (!req.session.userId) {
      return {
        errors: [
          {
            field: "User",
            message: "User is not authenticated.",
          },
        ],
        success: false,
      };
    }

    if (!req.session.charityAdminIds) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    const ev = await Event.findOne({ where: { id: id, auditstat: true } });

    if (!ev) {
      return {
        errors: [
          {
            field: "Event",
            message: "That event does not exist.",
          },
        ],
        success: false,
      };
    }

    const charityId = ev.charityId;

    const adids = req.session.charityAdminIds.filter((i) => i === charityId);

    if (adids.length === 0) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    try {
      // mark Event as completed
      await getConnection().transaction(async (tm) => {
        tm.createQueryBuilder()
          .update(Event)
          .set({ completed: true })
          .where({ id: id })
          .execute();
      });

      // mark eventVolunteers as completed where approved already
      await getConnection().transaction(async (tm) => {
        tm.createQueryBuilder()
          .update(Eventvolunteer)
          .set({ volunteeringCompleted: true })
          .where(`"eventId" = :eid`, { eid: id })
          .andWhere(`auditstat = true`)
          .andWhere(`adminapproval = 'approved'`)
          .execute();
      });

      // mark eventVolunteers as rejected where pending approval already
      await getConnection().transaction(async (tm) => {
        tm.createQueryBuilder()
          .update(Eventvolunteer)
          .set({ adminapproval: AdminApproval.REJECTED })
          .where(`"eventId" = :eid`, { eid: id })
          .andWhere(`auditstat = true`)
          .andWhere(`adminapproval = 'rejected'`)
          .execute();
      });

      const taskids = await getConnection()
        .createQueryBuilder()
        .select(`t.*`)
        .from(Event, `ev`)
        .innerJoin(Task, `t`, `ev.id = t."eventId"`)
        .where(`ev.id = :evid`, { evid: id })
        .getRawMany<Task>()
        .then((t) => t.map((i) => i.id));

      // mark tasks as completed
      await getConnection().transaction(async (tm) => {
        tm.createQueryBuilder()
          .update(Task)
          .set({ completionstatus: TaskCompletionStatus.CLOSED })
          .where(`"eventId" = :eid`, { eid: id })
          .andWhere(`auditstat = true`)
          .execute();
      });

      // mark taskvolunteers as deleted
      await getConnection().transaction(async (tm) => {
        tm.createQueryBuilder()
          .update(Taskvolunteer)
          .set({ auditstat: false })
          .where(`"taskId" in {:...tid}`, { tid: taskids })
          .andWhere(`auditstat = true`)
          .execute();
      });
    } catch (err) {
      return {
        success: false,
        errors: [{ field: "DB", message: "Unable to mark event as complete." }],
      };
    }

    return { success: true, event: ev };
  }
}
