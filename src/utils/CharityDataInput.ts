import {
  Field,

  InputType,
  Int
} from "type-graphql";

@InputType()
export class CharityDataInput {
  @Field()
  uen!: string;
  @Field()
  name!: string;
  @Field()
  physicalAddress!: string;
  @Field()
  postalcode!: string;
}

@InputType()
export class CharityProfileUpdateInput {

  @Field()
  name!: string;

  @Field()
  physicalAddress!: string;

  @Field()
  postalcode!: string;

  @Field()
  about: string

  @Field(() => String, {nullable: true})
  links?: string

  @Field(() => [Int], {nullable: true})
  categories?: number[];


}