import { Field, ObjectType } from "type-graphql";
import { Task } from "../../entities/Task";
import { FieldError } from "../../resolvers/user";
import PaginatedResponse from "./PaginatedResponse";

@ObjectType()
export class PaginatedTasks extends PaginatedResponse(Task) {
    @Field(() => Boolean)
    success!: boolean;

    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[];

}
