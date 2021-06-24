import {
    Field,
  
    InputType,
  
  
    ObjectType
  } from "type-graphql";
  import { Event } from "../../entities/Event";
  
  
  @InputType()
  export class EventInput {
    @Field()
    title: string;
    @Field()
    text: string;
  }
  
  @ObjectType()
  export class PaginatedEvents {
    @Field(() => [Event])
    events: Event[];
    @Field()
    hasMore: boolean;
  }
  