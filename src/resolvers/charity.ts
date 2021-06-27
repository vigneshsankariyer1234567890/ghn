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
import { Category } from "../entities/Category";
import { Charitycategory } from "../entities/Charitycategory";
import { Charityfollow } from "../entities/Charityfollow";

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

  @Field(() => Boolean)
  success: boolean;
}

@ObjectType()
class PaginatedCharities {
  @Field(() => [Charity])
  charities: Charity[];
  @Field()
  hasMore: boolean;
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

@Resolver(Charity)
export class CharityResolver {
  @FieldResolver(() => User)
  charitycreator(@Root() charity: Charity, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(charity.charitycreatorId);
  }

  @FieldResolver(() => [Category])
  async categories(
    @Root() charity: Charity,
    @Ctx() { categoryLoader }: MyContext
  ) {
    // n+1 problem, n posts, n sql queries executed
    // return User.findOne(post.creatorId);

    // using dataloader
    const charitycategories = await Charitycategory.find({
      where: { charityId: charity.id },
    });

    if (charitycategories.length < 1) {
      return [];
    }

    const catids = charitycategories.map((cc) => cc.categoryId);

    return await categoryLoader.loadMany(catids);
  }

  @FieldResolver(() => Int, { nullable: true })
  async followStatus(@Root() charity: Charity, @Ctx() { charityFollowLoader, req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    const follow = await charityFollowLoader.load({
      charId: charity.id,
      userId: req.session.userId,
    });

    return follow ? 1 : null;
  }

  @Query(() => Charity, { nullable: true })
  charity(@Arg("uen", () => String) uen: string): Promise<Charity | undefined> {
    return Charity.findOne({ where: { uen: uen } });
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
          userroleId: 1,
          charityId: charity.id,
        })
        .execute();
      await getConnection()
        .createQueryBuilder()
        .insert()
        .into(Charityfollow)
        .values({
          userId: req.session.userId,
          charityId: charity.id
        })
        .execute();
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
          success: false
        };
      }
    }
    return { charity, success: true };
  }

  @Query(() => PaginatedCharities)
  async searchCharitiesByCategories(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Arg("categories", () => [Number], { nullable: true })
    categories: [number] | null
  ): Promise<PaginatedCharities> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne];

    if (categories) {
      const catcsv = categories
        .reduce<string>((a, b) => a + b + `,`, ``)
        .slice(0, -1);
      replacements.push(catcsv);

      if (cursor) {
        replacements.push(new Date(parseInt(cursor))); //cursor null at first
      }

      //actual query
      const chars = await getConnection().query(
        `
        SELECT DISTINCT char.* 
        FROM charitycategory cc
        INNER JOIN 
        (SELECT id FROM unnest(string_to_array( $2, ',')::int[]) AS id
        ) cat
        ON cat.id = cc."categoryId"
        FULL JOIN charity char ON char.id = cc."charityId"
        WHERE cc.auditstat = TRUE
        ${cursor ? `AND char."createdAt" < $3` : ""}
        ORDER BY char."createdAt" DESC
        limit $1;
        `,
        replacements
      );

      return {
        charities: chars.slice(0, realLimit),
        hasMore: chars.length === realLimitPlusOne,
      };
    }

    if (cursor) {
      replacements.push(new Date(parseInt(cursor))); //cursor null at first
    }

    const chars = await getConnection().query(
      `

    SELECT char.* 
    FROM charity char
    ${cursor ? `where char."createdAt" < $2` : ""}
    order by char."createdAt" DESC
    limit $1
    `,
      replacements
    );

    return {
      charities: chars.slice(0, realLimit),
      hasMore: chars.length === realLimitPlusOne,
    };
  }

  @Mutation(() => CharityResponse)
  @UseMiddleware(isAuth)
  async followCharity(
    @Arg("charityId", () => Int) charityId: number,
    @Ctx() { req }: MyContext
  ): Promise<CharityResponse> {
    const { userId } = req.session;

    const follow = await Charityfollow.findOne({ where: { charityId, userId, auditstat:true } });

    // user has liked post before and unliking the post
    if (follow) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
                update charityfollow 
                set auditstat = false
                where id = $1
            `,
          [follow.id]
        );

        await tm.query(
          `
                update charity 
                set "followNumber" = "followNumber" - 1
                where id = $1
                and "followNumber">0
            `,
          [charityId]
        );
      });
    } else if (!follow) {
      //has never liked before
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
            insert into charityfollow ("userId", "charityId")
            values ($1, $2)
          `,
          [userId, charityId]
        );

        await tm.query(
          `
                update charity 
                set "followNumber" = "followNumber" + 1
                where id = $1
            `,
          [charityId]
        );
      });
    }
    return (follow) ? {success:false} : {success: true}; // returning unfollowing/following
  }
}
