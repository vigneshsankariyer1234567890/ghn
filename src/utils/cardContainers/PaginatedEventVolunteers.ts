import { ObjectType, Field } from "type-graphql";
import { Eventvolunteer } from "../../entities/Eventvolunteer";
import { FieldError } from "../../resolvers/user";

@ObjectType()
  export class PaginatedEventVolunteers {
    @Field(() => [Eventvolunteer])
    eventvolunteers?: Eventvolunteer[];
    @Field()
    hasMore: boolean;
    @Field(() => [FieldError])
    errors?: FieldError[]
    @Field(() => Boolean)
    success: boolean
  }