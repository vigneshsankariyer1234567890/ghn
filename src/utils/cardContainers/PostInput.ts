import {
  Field,
  InputType,
  ObjectType
} from "type-graphql";
import { getConnection } from "typeorm";
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

@ObjectType()
export class EPost {
  @Field(() => Post)
  post: Post;

  @Field(() =>  Number, {nullable: true})
  eventId?: number;

  @Field(() => String, {nullable: true})
  eventName?: string;

  @Field(() => Boolean)
  isEvent: boolean

  @Field(() => Boolean)
  creatorStatus: boolean

  constructor(post: Post, isEvent: boolean, eventId?: number, eventName?: string) {
    this.post = post;
    this.isEvent = isEvent;
    this.eventId = eventId;
    this.eventName = eventName;
  }
}

@ObjectType()
export class PaginatedPosts extends PaginatedResponse(EPost) {
  public static async convertPostsToEPosts(postarr: Post[], viewerId?: number): Promise<EPost[]> {
    
    if (postarr.length === 0) {
      return [];
    }

    const pids = postarr.map(p => p.id);

    const pidToEventInfo: Record<number, {eventId?: number, eventName?: string}> = {};

    const result = await getConnection()
      .createQueryBuilder()
      .select('pel."postId"', "postid")
      .addSelect('po."isEvent"')
      .addSelect('pel."eventId"')
      .addSelect('pel."eventName"')
      .from(Post, "po")
      .leftJoin(Posteventlink, "pel", 'pel."postId" = po.id')
      .where('po.id IN (:...ids)', {ids: pids})
      .getRawMany<{postid: number, isEvent: boolean, eventId?: number, eventName?: string}>();

    result.forEach((elem) => {pidToEventInfo[elem.postid] = 
      {
        eventId: elem.isEvent ? elem.eventId : undefined,
        eventName: elem.isEvent ? elem.eventName: undefined
      }
    });

    return postarr.map<EPost>( p => { 
      return {
        post: p, 
        isEvent: p.isEvent, 
        eventId: p.isEvent ? pidToEventInfo[p.id].eventId : undefined,
        eventName: p.isEvent ? pidToEventInfo[p.id].eventName : undefined,
        creatorStatus: !viewerId ? false : p.creatorId === viewerId
      }
    })
  }
}


