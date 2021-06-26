import { InputType, Field, Int } from "type-graphql";

@InputType()
export class CharityUserInput {
  
  @Field(() => String, {nullable: true})
  uen?: string;

  @Field(() => Int, {nullable: true})
  charityId?: number;

  @Field()
  userid: number;
}