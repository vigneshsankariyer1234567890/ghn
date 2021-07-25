import { ObjectType, Field, Int } from "type-graphql";
import { AdminApproval } from "../../entities/Eventvolunteer";
import { User } from "../../entities/User";
import { FieldError } from "../../resolvers/user";
import PaginatedResponse from "./PaginatedResponse";

@ObjectType()
export class EventVolunteerContainer {
  @Field(() => User, {nullable: true})
  user?: User

  @Field(() => AdminApproval, {nullable: true})
  adminapproval?: AdminApproval

  @Field(() => Int, {nullable: true})
  eventId?: number

  @Field(() => String, {nullable: true})
  updatedAt?: Date

  constructor(user?: User, adminapproval?: AdminApproval, eventId?: number, updatedAt?: Date) {
    this.user = user;
    this.adminapproval = adminapproval
    this.eventId = eventId
    this.updatedAt = updatedAt
  }
}

@ObjectType()
export class PaginatedEventVolunteers extends PaginatedResponse(EventVolunteerContainer) {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => Boolean)
  success: boolean;
}

