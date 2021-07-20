import { InputType, Field, Int } from "type-graphql";
import { Genders } from "../entities/Userprofile";

@InputType()
export class UsernamePasswordInput {
  @Field()
  email: string;
  @Field()
  username: string;
  @Field()
  password: string;
}

@InputType()
export class UserProfileUpdateInput {

  @Field()
  email: string

  @Field()
  about: string

  @Field(() => Genders, {nullable: true})
  gender?: Genders

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => String, {nullable: true})
  telegramHandle?: string;

  @Field(() => String, {nullable: true})
  displayPicture?: string;

  @Field(() => [Int], {nullable: true})
  categories?: number[];
}