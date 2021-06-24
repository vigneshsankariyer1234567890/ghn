import {
  Field,

  InputType,


  ObjectType
} from "type-graphql";
import { Post } from "../entities/Post";


@InputType()
export class PostInput {
  @Field()
  title: string;
  @Field()
  text: string;
}

@ObjectType()
export class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];
  @Field()
  hasMore: boolean;
}
