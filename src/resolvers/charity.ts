import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import axios from "axios";
import { FieldError } from "./user";
import { isAuth } from "../middleware/isAuth";
import { Charity } from "../entities/Charity";
import { MyContext } from "../types";
import { UENData } from "../utils/UENData";
import { getConnection } from "typeorm";
import { Charityrolelink } from "../entities/Charityrolelink";
import { User } from "../entities/User";

@ObjectType()
class UENResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => UENData, { nullable: true })
  uendata?: UENData;

  @Field(() => Boolean, { nullable: true })
  success!: boolean;
}

@ObjectType()
class CharityResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Charity, { nullable: true })
  charity?: Charity;
}

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

@Resolver()
export class CharityResolver {
  @FieldResolver(() => User)
  charitycreator(@Root() charity: Charity, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(charity.charitycreatorId);
  }

  @Query(() => Charity, { nullable: true })
  charity(@Arg("id", () => Int) id: number): Promise<Charity | undefined> {
    return Charity.findOne(id);
  }

  @UseMiddleware(isAuth)
  @Query(() => UENResponse)
  async checkUENNumber(
    @Arg("UENNumber", () => String) UENNumber: string
  ): Promise<UENResponse> {
    if (UENNumber === "") {
      return {
        errors: [
          {
            field: "UEN Number",
            message: "Please provide a UEN Number!",
          },
        ],
        success: false,
      };
    }

    if (UENNumber.length < 9 || UENNumber.length > 10) {
      return {
        errors: [
          {
            field: "UEN Number",
            message:
              "UEN Number is not valid; please provide a valid UEN Number!",
          },
        ],
        success: false,
      };
    }

    const check = await Charity.findOne({ where: { uen: UENNumber } });

    if (check) {
      return {
        errors: [
          {
            field: "UEN Number",
            message: "A charity with this UEN Number already exists.",
          },
        ],
        success: false,
      };
    }

    let url =
      "https://data.gov.sg/api/action/datastore_search?resource_id=5ab68aac-91f6-4f39-9b21-698610bdf3f7&limit=5&q=";

    url = url + UENNumber;

    const res = await axios
      .get(url)
      .then(
        (res) =>
          res.data.result.records.length === 1 &&
          res.data.result.records[0].entity_type === "CC"
      );

    if (!res) {
      return {
        errors: [
          {
            field: "UEN Number",
            message: "No such organisation exists",
          },
        ],
        success: false,
      };
    }

    const uen = await axios.get(url).then((obj) => {
      const obj2 = obj.data.result.records[0];
      return new UENData(
        obj2.uen,
        obj2.reg_street_name,
        obj2.entity_name,
        obj2.entity_type,
        obj2.reg_postal_code,
        obj2.issuance_agency_id,
        obj2.uen_issue_date,
        obj2.uen_status
      );
    });

    return {
      uendata: uen,
      success: true,
    };
  }

  @UseMiddleware(isAuth)
  @Mutation(() => CharityResponse)
  async createCharity(
    @Arg("options") options: CharityDataInput,
    @Ctx() { req }: MyContext
  ): Promise<CharityResponse> {
    let charity;
    try {
      // User.create({}).save()
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Charity)
        .values({
          name: options.name,
          uen: options.uen,
          physicalAddress: options.physicalAddress,
          postalcode: options.postalcode,
          charitycreatorId: req.session.userId,
        })
        .returning("*")
        .execute();
      charity = result.raw[0];
      await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Charityrolelink)
        .values({
          userId: req.session.userId,
          userroleId: 0,
          charityId: charity.id,
        });
    } catch (err) {
      //|| err.detail.includes("already exists")) {
      // duplicate username error
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "Charity",
              message: "A charity with the same UEN number already exists",
            },
          ],
        };
      }
    }
    return { charity };
  }
}
