import {
    Field,
    InputType,
    ObjectType
} from "type-graphql";
import { Task } from "../../entities/Task";
import { FieldError } from "../../resolvers/user";


@InputType()
export class TaskInput {

    @Field()
    description!: string;

    @Field(() => String)
    deadline!: Date;

}

@ObjectType()
export class TaskResponse {
    @Field(() => Boolean)
    success!: boolean;

    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[];

    @Field(() => Task, {nullable: true})
    task?: Task;
}
