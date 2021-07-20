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
  postalCode!: string;
}

@InputType()
export class CharityProfileUpdateInput {

  @Field()
  name!: string;

  @Field()
  physicalAddress!: string;

  @Field()
  postalCode!: string;

  @Field()
  about: string

  @Field(() => String, {nullable: true})
  links?: string

  @Field(() => String, {nullable: true})
  contactNumber?: string;

  @Field(() => String, {nullable: true})
  email?: string;

  @Field(() => [Int], {nullable: true})
  categories?: number[];


}