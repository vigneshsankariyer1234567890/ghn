import { InputType, Field } from "type-graphql";

@InputType()
export class CharityUserInput {
  @Field()
  uen: string;
  @Field()
  userid: number;
}