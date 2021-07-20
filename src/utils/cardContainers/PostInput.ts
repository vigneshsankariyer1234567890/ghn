import { Field, InputType, ObjectType } from "type-graphql";
import { getConnection } from "typeorm";
import { Event } from "../../entities/Event";
import { Post } from "../../entities/Post";
import { Posteventlink } from "../../entities/Posteventlink";
import PaginatedResponse from "./PaginatedResponse";

@InputType()
export class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

// @ObjectType()
// export class EPost {
//   @Field(() => Post)
//   post: Post;

//   @Field(() => Number, { nullable: true })
//   eventId?: number;

//   @Field(() => String, { nullable: true })
//   eventName?: string;

//   @Field(() => Boolean)
//   isEvent: boolean;

//   @Field(() => Boolean)
//   creatorStatus: boolean;

//   constructor(
//     post: Post,
//     isEvent: boolean,
//     eventId?: number,
//     eventName?: string
//   ) {
//     this.post = post;
//     this.isEvent = isEvent;
//     this.eventId = eventId;
//     this.eventName = eventName;
//   }
// }

@ObjectType()
export class EPost {
  @Field(() => Post)
  post: Post;

  @Field(() => Event, { nullable: true })
  event?: Event;

  constructor(post: Post, event?: Event) {
    this.post = post;
    this.event = event;
  }
}

@ObjectType()
export class PaginatedPosts extends PaginatedResponse(EPost) {
  // public static async convertPostsToEPosts(
  //   postarr: Post[],
  //   viewerId?: number
  // ): Promise<EPost[]> {
  //   if (postarr.length === 0) {
  //     return [];
  //   }

  //   const pids = postarr.map((p) => p.id);

  //   const pidToEventInfo: Record<
  //     number,
  //     { eventId?: number; eventName?: string }
  //   > = {};

  //   const result = await getConnection()
  //     .createQueryBuilder()
  //     .select('pel."postId"', "postid")
  //     .addSelect('po."isEvent"')
  //     .addSelect('pel."eventId"')
  //     .addSelect('pel."eventName"')
  //     .from(Post, "po")
  //     .leftJoin(Posteventlink, "pel", 'pel."postId" = po.id')
  //     .where("po.id IN (:...ids)", { ids: pids })
  //     .getRawMany<{
  //       postid: number;
  //       isEvent: boolean;
  //       eventId?: number;
  //       eventName?: string;
  //     }>();

  //   result.forEach((elem) => {
  //     pidToEventInfo[elem.postid] = {
  //       eventId: elem.isEvent ? elem.eventId : undefined,
  //       eventName: elem.isEvent ? elem.eventName : undefined,
  //     };
  //   });

  //   return postarr.map<EPost>((p) => {
  //     return {
  //       post: p,
  //       isEvent: p.isEvent,
  //       eventId: p.isEvent ? pidToEventInfo[p.id].eventId : undefined,
  //       eventName: p.isEvent ? pidToEventInfo[p.id].eventName : undefined,
  //       creatorStatus: !viewerId ? false : p.creatorId === viewerId,
  //     };
  //   });
  // }

  public static async convertPostsToEPosts(postarr: Post[]): Promise<EPost[]> {
    if (postarr.length === 0) {
      return [];
    }

    const pids = postarr.map((p) => p.id);

    const result = await getConnection()
      .createQueryBuilder()
      .select('pel."postId"')
      .addSelect('pel."eventId"')
      .from(Post, "po")
      .innerJoin(Posteventlink, "pel", 'pel."postId" = po.id')
      .where("po.id IN (:...ids)", { ids: pids })
      .getRawMany<{ postId: number; eventId: number }>();

    const eventIds: number[] = [];

    result.forEach((a) => {
      eventIds.push(a.eventId);
    });

    const events = await getConnection()
      .createQueryBuilder()
      .select(`ev.*`)
      .from(Event, `ev`)
      .where(`ev.id in (:...eids)`, {eids: eventIds})
      .getRawMany<Event>();

    const eposts = postarr.map((po) => {
      const filtered = result.filter((r) => r.postId === po.id);
      if (filtered.length === 0) {
        return new EPost(po);
      }
      const f = filtered[0];
      const filteredEvents = events.filter((e) => e.id === f.eventId);
      if (filteredEvents.length === 0) {
        return new EPost(po);
      }
      return new EPost(po, filteredEvents[0]);
    });

    return eposts;
  }
}
