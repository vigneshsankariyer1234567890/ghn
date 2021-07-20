import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
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
// import { Charitycategory } from "../entities/Charitycategory";
import { Charityfollow } from "../entities/Charityfollow";
import { Event } from "../entities/Event";
import { FriendRequestStatus, Userfriend } from "../entities/Userfriend";
// import { Charitycategory } from "../entities/Charitycategory";
import { PaginatedCharities } from "../utils/cardContainers/PaginatedCharitiesAndUsers";
import {
  CharityDataInput,
  CharityProfileUpdateInput,
} from "../utils/CharityDataInput";
import { Charityprofile } from "../entities/Charityprofile";
import { CategoryResolver } from "./category";
import { Userprofile } from "../entities/Userprofile";

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

@Resolver(Charity)
export class CharityResolver {
  @FieldResolver(() => User)
  charitycreator(@Root() charity: Charity, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(charity.charitycreatorId);
  }

  @FieldResolver(() => Charityprofile, { nullable: true })
  async profile(
    @Root() charity: Charity,
    @Ctx() { charityProfileLoader }: MyContext
  ): Promise<Charityprofile | null> {
    return await charityProfileLoader.load(charity.id);
  }

  @FieldResolver(() => [Category])
  async categories(
    @Root() charity: Charity,
    @Ctx() { categoryLoader, charityCategoryLoader }: MyContext
  ): Promise<(Category | Error)[]> {
    const charitycategories = await charityCategoryLoader.load(charity.id);

    if (charitycategories.length < 1) {
      return [];
    }

    const catids = charitycategories.map((cc) => cc.categoryId);

    return await categoryLoader.loadMany(catids);
  }

  @FieldResolver(() => Int, { nullable: true })
  async followStatus(
    @Root() charity: Charity,
    @Ctx() { req, singleCharityFollowLoader }: MyContext
  ) {
    if (!req.session.userId) {
      return null;
    }
    const follow = await singleCharityFollowLoader.load({
      charityId: charity.id,
      userId: req.session.userId,
    });

    return follow ? 1 : null;
  }

  @FieldResolver(() => [User])
  async followers(
    @Root() charity: Charity,
    @Ctx() { userLoader, charityFollowersLoader }: MyContext
  ): Promise<(User | Error)[]> {
    const rec = await charityFollowersLoader.load(charity.id);

    if (!rec) {
      return [];
    }

    const nums = rec.map((r) => r.userId);

    return await userLoader.loadMany(nums);
  }

  @FieldResolver(() => [Event])
  async charityEvents(
    @Root() charity: Charity,
    @Ctx() { charityEventsLoader }: MyContext
  ): Promise<(Event | Error)[]> {
    return await charityEventsLoader.load(charity.id);
  }

  @FieldResolver(() => Boolean)
  async adminStatus(
    @Root() charity: Charity,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    if (!req.session.userId) {
      return false;
    }

    if (!req.session.charityAdminIds) {
      return false;
    }

    const adids = req.session.charityAdminIds.reduce(
      (a, b) => a || b === charity.id,
      false
    );

    return adids;
  }

  @Query(() => Charity, { nullable: true })
  charitySearchByUEN(
    @Arg("uen", () => String) uen: string
  ): Promise<Charity | undefined> {
    return Charity.findOne({ where: { uen: uen } });
  }

  @Query(() => Charity, { nullable: true })
  charitySearchByID(
    @Arg("id", () => Int) id: number
  ): Promise<Charity | undefined> {
    return Charity.findOne({ where: { id: id } });
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
            field: "uen",
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
            field: "uen",
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
            field: "uen",
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
            field: "uen",
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
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User is not authenticated." }],
      };
    }

    const uenresp: UENResponse = await this.checkUENNumber(options.uen);

    if (!uenresp.success) {
      return {
        success: false,
        errors: uenresp.errors,
      };
    }

    if (!uenresp.uendata) {
      return {
        success: false,
        errors: [
          { field: "uen", message: "UEN Validation was unsuccessful." },
        ],
      };
    }

    const uendata: UENData = uenresp.uendata;

    // if (uendata.entity_name !== options.name) {
    //   return {
    //     success: false,
    //     errors: [
    //       {
    //         field: "Charity Name",
    //         message: "Charity Name does not match entity registered name.",
    //       },
    //     ],
    //   };
    // }

    if (uendata.reg_postal_code !== options.postalCode) {
      return {
        success: false,
        errors: [
          {
            field: "postalcode",
            message:
              "The postal code given does not match registered postal code.",
          },
        ],
      };
    }

    const up = await Userprofile.findOne({where: { userId: req.session.id }});

    if (!up) {
      return {
        errors: [{ field: "User", message: 
          `Your user details have not been updated. 
          Please update your details before proceeding.` }],
        success: false,
      }
    }

    if (!up.telegramHandle) {
      return {
        errors: [{ field: "User", message: 
          `Your Telegram handle needs to be updated. 
          Please update your Telegram handle before proceeding.` }],
        success: false,
      }
    }

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
          postalCode: options.postalCode,
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
          charityId: charity.id,
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
          success: false,
        };
      }
      return {
        errors: [{ field: "Charity", message: "Unable to create charity" }],
        success: false,
      };
    }
    // inserting into charity admin keys in redis server
    if (!charity) {
      return {
        success: false,
        errors: [{ field: "Charity", message: "Unable to create charity" }],
      };
    }
    if (!req.session.charityAdminIds) {
      req.session.charityAdminIds = [charity.id];
    }
    req.session.charityAdminIds.push(charity.id);
    return { charity, success: true };
  }

  @UseMiddleware(isAuth)
  @Mutation(() => CharityResponse)
  async updateCharityProfile(
    @Arg("charityId") charityId: number,
    @Arg("options") options: CharityProfileUpdateInput,
    @Ctx() { req }: MyContext
  ): Promise<CharityResponse> {
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User not authenticated." }],
      };
    }

    if (!req.session.charityAdminIds) {
      return {
        success: false,
        errors: [
          { field: "User", message: "User is not an admin of the charity" },
        ],
      };
    }

    const adid = req.session.charityAdminIds.reduce(
      (a, b) => a || b === charityId,
      false
    );

    if (!adid) {
      return {
        success: false,
        errors: [
          { field: "User", message: "User is not an admin of the charity" },
        ],
      };
    }

    const charity = await Charity.findOne(charityId);

    if (!charity) {
      return {
        success: false,
        errors: [
          { field: "Fatal", message: "Please contact the Givehub Developers." },
        ],
      };
    }

    if (options.categories) {
      const resp = await CategoryResolver.updateCharityCategories({categories: options.categories}, charity.id);
      if (!resp.success) {
        return {
          success: false,
          errors: resp.errors
        }
      }
    }

    charity.name = charity.name !== options.name ? options.name : charity.name;
    charity.physicalAddress =
      charity.physicalAddress !== options.physicalAddress
        ? options.physicalAddress
        : charity.physicalAddress;
    charity.postalCode =
      charity.postalCode !== options.postalCode
        ? options.postalCode
        : charity.postalCode;

    const charityprofs = await getConnection()
      .createQueryBuilder()
      .select()
      .from(Charityprofile, `cp`)
      .where(`cp."charityId" = :cid`, { cid: charity.id })
      .getRawOne<Charityprofile>();

    if (!charityprofs) {
      await Charityprofile.create({
        charity: charity,
        about: options.about,
        links: options.links,
        email: options.email,
        contactNumber: options.contactNumber
      }).save();
    } else {
      await getConnection().transaction(async (tm) => {
        await tm
          .createQueryBuilder()
          .update(Charityprofile)
          .set({
            about: options.about,
            links: options.links,
            email: options.email,
            contactNumber: options.contactNumber
          })
          .where(`"charityId" = :cid`, { cid: charity.id })
          .execute();
      });
    }

    await charity.save();

    return { success: true, charity: charity };
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
        items: chars.slice(0, realLimit),
        hasMore: chars.length === realLimitPlusOne,
        total: chars.length,
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
      items: chars.slice(0, realLimit),
      hasMore: chars.length === realLimitPlusOne,
      total: chars.length,
    };
  }

  @Mutation(() => CharityResponse)
  @UseMiddleware(isAuth)
  async followCharity(
    @Arg("charityId", () => Int) charityId: number,
    @Ctx() { req }: MyContext
  ): Promise<CharityResponse> {
    const { userId } = req.session;

    const follow = await Charityfollow.findOne({
      where: { charityId: charityId, userId: userId, auditstat: true },
    });

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
    return follow ? { success: false } : { success: true }; // returning unfollowing/following
  }

  @Mutation(() => CharityResponse)
  @UseMiddleware(isAuth)
  async addAdminToCharity(
    @Arg("charityId", () => Int) charityId: number,
    @Arg("userId", () => Int) userId: number,
    @Ctx() { req }: MyContext
  ): Promise<CharityResponse> {
    if (!req.session.userId) {
      return {
        errors: [
          {
            field: "User",
            message: "User is not authenticated.",
          },
        ],
        success: false,
      };
    }

    if (!req.session.charityAdminIds) {
      return {
        errors: [
          { field: "Charity", message: "You are not an admin of the charity." },
        ],
        success: false,
      };
    }

    req.session.charityAdminIds.forEach((i) => console.log(i));

    const adids = req.session.charityAdminIds.filter((i) => i === charityId);

    if (adids.length === 0) {
      return {
        errors: [
          { field: "Charity", message: "You are not an admin of the charity." },
        ],
        success: false,
      };
    }

    const follow = await Charityfollow.findOne({
      where: { charityId: charityId, userId: userId, auditstat: true },
    });

    if (!follow) {
      return {
        errors: [
          { field: "Charity", message: "User must follow charity first." },
        ],
        success: false,
      };
    }

    if (userId === req.session.userId) {
      return {
        errors: [
          { field: "Admin", message: "You cannot add yourself as an admin." },
        ],
        success: false,
      };
    }

    const bigger = userId > req.session.userId;

    const userfriend = await Userfriend.findOne({
      where: {
        user1Id: bigger ? req.session.userId : userId,
        user2Id: bigger ? userId : req.session.userId,
        friendreqstatus: FriendRequestStatus.ACCEPTED,
      },
    });

    if (!userfriend) {
      return {
        errors: [
          {
            field: "Charity",
            message: `You have to be friends with the user before being able to add as admin.`,
          },
        ],
        success: false,
      };
    }

    const checkUserIsAdmin = await Charityrolelink.findOne({
      where: {
        userId: userId,
        charityId: charityId,
        userrole: 1,
        auditstat: true,
      },
    });

    if (checkUserIsAdmin) {
      return {
        errors: [
          {
            field: "Charity",
            message: `The user is already an admin of the charity.`,
          },
        ],
        success: false,
      };
    }

    await getConnection().transaction(async (tm) => {
      await tm
        .createQueryBuilder()
        .insert()
        .into(Charityrolelink)
        .values({
          userId: userId,
          userroleId: 1,
          charityId: charityId,
        })
        .execute();
    });

    return { success: true };
  }

  @Query(() => PaginatedCharities)
  async searchCharities(
    @Arg("limit", () => Int) limit: number,
    @Arg("categories", () => [Number]) categories: number[],
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Arg("input", () => String, { nullable: true }) input: string | null
  ): Promise<PaginatedCharities> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const catcsv = categories
      .reduce<string>((a, b) => a + b + `,`, ``)
      .slice(0, -1);

    // actual query
    const chars = await getConnection().query(
      `
      select * from (
        select distinct c.* from charity c 
        inner join charitycategory cc on c.id = cc."charityId"
        inner join (
          select c.id from (
            SELECT id FROM unnest(
              string_to_array( '${catcsv}', ',')::int[]
            ) AS id
          ) ca inner join category c on ca.id = c.id
          union all 
          select c.id from category c where ('${catcsv}'='')
        ) cat on cat.id = cc."categoryId"
        where cc.auditstat = true
      ) charities

      ${input ? `where charities.name ILIKE '` + input + `%'` : ""}
      ${
        cursor
          ? input
            ? `and charities.name > '` + cursor + `'`
            : `where charities.name > '` + cursor + `'`
          : ""
      }
      order by charities.name ASC
      limit ${realLimitPlusOne}
      `
    );

    const tot = await getConnection().query(
      `
      select COUNT(*) as "count" from (
        select * from (
          select distinct c.* from charity c 
          inner join charitycategory cc on c.id = cc."charityId"
          inner join (
            select c.id from (
              SELECT id FROM unnest(
                string_to_array( '${catcsv}', ',')::int[]
              ) AS id
            ) ca inner join category c on ca.id = c.id
            union all 
            select c.id from category c where ('${catcsv}'='')
          ) cat on cat.id = cc."categoryId"
          where cc.auditstat = true
        ) charities

        ${input ? `where charities.name ILIKE '` + input + `%'` : ""}
      ) c
      `
    );

    return {
      items: chars.slice(0, realLimit),
      hasMore: chars.length === realLimitPlusOne,
      total: parseInt(tot[0].count),
    };
  }
}
