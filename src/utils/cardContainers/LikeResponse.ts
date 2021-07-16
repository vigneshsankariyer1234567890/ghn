import { ClassType, Field, Int, ObjectType } from "type-graphql";
import { Event } from "../../entities/Event";
// import { Post } from "../../entities/Post";
import { FieldError } from "../../resolvers/user";
import { EPost } from "./PostInput";

@ObjectType()
export class PostLikeResponse extends LikeResponser(EPost) {
  
}

@ObjectType()
export class EventLikeResponse extends LikeResponser(Event) {
  
}

function LikeResponser<TItem>(TItemClass: ClassType<TItem>) {
  @ObjectType({ isAbstract: true })
  abstract class LikeResponseClass {
    @Field()
    success: boolean;

    @Field(() => TItemClass, { nullable: true })
    likeItem?: TItem;

    @Field(() => Boolean, { nullable: true })
    voteStatus?: boolean;

    @Field(() => Int, { nullable: true })
    likeNumber?: number;

    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];
  }

  return LikeResponseClass
}
