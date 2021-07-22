import { Field, InputType, ObjectType } from "type-graphql";
import { getConnection } from "typeorm";
import { Comment } from "../../entities/Comment";
import { Event } from "../../entities/Event";
import { Post } from "../../entities/Post";
import { Posteventlink } from "../../entities/Posteventlink";
import { FieldError } from "../../resolvers/user";
import PaginatedResponse from "./PaginatedResponse";

@InputType()
export class PostInput {
  // @Field()
  // title: string;
  @Field()
  text: string;
  @Field(() => String, {nullable: true})
  imageUrl?: string;
}

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
export class PaginatedComments extends PaginatedResponse(Comment) {

}

@ObjectType()
export class PaginatedPosts extends PaginatedResponse(EPost) {

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

    if (eventIds.length === 0) {
      return postarr.map(p => new EPost(p));
    }

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

@ObjectType()
export class PostResponse {
  @Field(() => EPost)
  epost?: EPost

  @Field()
  success: boolean

  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[]
}