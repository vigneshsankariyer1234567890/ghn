import { ObjectType } from "type-graphql";
import { Charity } from "../../entities/Charity";
import { User } from "../../entities/User";
import PaginatedResponse from "./PaginatedResponse";

@ObjectType()
export class PaginatedCharities extends PaginatedResponse(Charity) {

}

@ObjectType()
export class PaginatedUsers extends PaginatedResponse(User) {
    
}