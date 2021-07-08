import { ObjectType, Field } from "type-graphql";
import { FieldError } from "../../resolvers/user";

@ObjectType()
export class TaskVolunteerResponse {
    @Field(() => Boolean)
    success!: boolean;

    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[];

}