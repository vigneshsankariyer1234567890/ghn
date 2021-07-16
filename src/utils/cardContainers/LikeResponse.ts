import { Field, Int, ObjectType } from "type-graphql";
import { FieldError } from "../../resolvers/user";


@ObjectType()
export class LikeResponse {

    @Field()
    success: boolean;

    @Field(() => Int, { nullable: true })
    id?: number;

    @Field(() => Boolean, { nullable: true })
    voteStatus?: boolean;

    @Field(() => Int, { nullable: true })
    likeNumber?: number;

    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];
}
