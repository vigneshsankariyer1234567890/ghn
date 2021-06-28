import { Field, ObjectType } from "type-graphql";
import { Event } from "../../entities/Event";
import { Task } from "../../entities/Task";


@ObjectType()
export class EventTaskContainer {
    @Field(() => Event)
    event!: Event

    @Field(() => [Task])
    tasks!: Task[]

    constructor(event: Event, tasks: Task[]) {
        this.event = event;
        this.tasks = tasks;
    }
}

@ObjectType()
export class EventTaskContainerResponse {
    @Field(() => [EventTaskContainer])
    eventContainers?: EventTaskContainer[]

    @Field(() => Boolean)
    success!: boolean
}