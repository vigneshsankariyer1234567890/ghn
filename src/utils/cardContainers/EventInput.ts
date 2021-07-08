import { Field, InputType, ObjectType } from "type-graphql";
import { Event } from "../../entities/Event";

@InputType()
export class EventInput {
  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field(() => String)
  dateStart!: Date;

  @Field(() => String)
  dateEnd!: Date;

  @Field(() => String, { nullable: true })
  venue?: string;
}

@ObjectType()
export class PaginatedEvents {
  @Field(() => [Event])
  events: Event[];
  @Field()
  hasMore: boolean;
}
