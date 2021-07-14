import { ObjectType, Field } from "type-graphql";
import { Eventvolunteer } from "../../entities/Eventvolunteer";
import { FieldError } from "../../resolvers/user";
import PaginatedResponse from "./PaginatedResponse";

@ObjectType()
  export class PaginatedEventVolunteers extends PaginatedResponse(Eventvolunteer){
    @Field(() => [FieldError])
    errors?: FieldError[]
    @Field(() => Boolean)
    success: boolean
  }