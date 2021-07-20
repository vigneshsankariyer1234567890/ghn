import { Field, InputType, ObjectType } from "type-graphql";
import { Event } from "../../entities/Event";
import PaginatedResponse from "./PaginatedResponse";

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

  @Field(() => String, {nullable: true})
  imageUrl?: string;
  
}

@ObjectType()
export class PaginatedEvents extends PaginatedResponse(Event) {

}


