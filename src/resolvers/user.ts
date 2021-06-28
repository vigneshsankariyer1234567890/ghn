import {
  Resolver,
  Mutation,
  Arg,
  Field,
  Ctx,
  ObjectType,
  Query,
  FieldResolver,
  Root,
} from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "../utils/UsernamePasswordInput";
import { validateRegister } from "../utils/validateRegister";
import { sendEmail } from "../utils/sendEmail";
import { v4 } from "uuid";
import { getConnection } from "typeorm";
import { Category } from "../entities/Category";
import { Usercategory } from "../entities/Usercategory";
import { Charity } from "../entities/Charity";
import { Charityfollow } from "../entities/Charityfollow";
import { Charityrolelink } from "../entities/Charityrolelink";
import { Event } from "../entities/Event";
import { Eventlike } from "../entities/Eventlike";

@ObjectType()
export class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    // this is the current user and its ok to show them their own email
    if (req.session.userId === user.id) {
      return user.email;
    }
    // current user wants to see someone elses email
    return "";
  }

  @FieldResolver(() => [Category])
  async categories(@Root() user: User, @Ctx() { categoryLoader }: MyContext) {
    // n+1 problem, n posts, n sql queries executed
    // return User.findOne(post.creatorId);

    // using dataloader
    const usercategories = await getConnection() //await Usercategory.findByIds([user.id]);
      .createQueryBuilder()
      .select("*")
      .from(Usercategory, `uc`)
      .where(`uc.auditstat = TRUE`)
      .andWhere(`uc."userId" = :id`, { id: user.id })
      .getRawMany<Usercategory>();

    if (usercategories.length < 1) {
      return [];
    }

    const catids = usercategories.map((uc) => uc.categoryId);

    return await categoryLoader.loadMany(catids);
  }

  @FieldResolver(() => [Charity])
  async followedCharities(
    @Root() user: User,
    @Ctx() { charityLoader }: MyContext
  ): Promise<(Charity | Error)[]> {
    // n+1 problem, n posts, n sql queries executed
    // return User.findOne(post.creatorId);

    // using dataloader
    const charityfollows = await Charityfollow.find({
      where: { userId: user.id, auditstat: true },
    });

    if (charityfollows.length < 1) {
      return [];
    }

    const charIds = charityfollows.map((cf) => cf.charityId);

    return await charityLoader.loadMany(charIds);
  }

  @FieldResolver(() => [Charity])
  async adminCharities(
    @Root() user: User,
    @Ctx() { charityLoader }: MyContext
  ): Promise<(Charity | Error)[]> {
    // n+1 problem, n posts, n sql queries executed
    // return User.findOne(post.creatorId);

    // using dataloader
    const crls = await Charityrolelink.find({
      where: { userId: user.id, auditstat: true },
    });

    if (crls.length < 1) {
      return [];
    }

    const charIds = crls.map((cf) => cf.charityId);

    return await charityLoader.loadMany(charIds);
  }

  @FieldResolver(() => [Event])
  async likedEvents(
    @Root() user: User,
    @Ctx() { eventLoader }: MyContext
  ): Promise<(Event | Error)[]> {
    const likedEvents = await Eventlike.find({
      where: { userId: user.id, auditstat: true },
    });

    if (likedEvents.length < 1) {
      return [];
    }

    const eventIds = likedEvents.map((le) => le.eventId);

    return await eventLoader.loadMany(eventIds);
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    // you are not logged in
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(options);
    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);
    let user;
    try {
      // User.create({}).save()
      const result = await getConnection()
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({
          username: options.username,
          email: options.email,
          password: hashedPassword,
        })
        .returning("*")
        .execute();
      user = result.raw[0];
    } catch (err) {
      //|| err.detail.includes("already exists")) {
      // duplicate username error
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already taken",
            },
          ],
        };
      }
    }

    // store user id session
    // this will set a cookie on the user
    // keep them logged in
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail } }
        : { where: { username: usernameOrEmail } }
    );
    if (!user) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "that username doesn't exist",
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password",
          },
        ],
      };
    }

    req.session.userId = user.id;

    // Find the charities that user is admin of, map to charity ids and store in cookie

    const charityAdmins = await Charityrolelink.find({
      where: { auditstat: true, userId: user.id },
    });

    if (charityAdmins.length > 0) {
      req.session.charityAdminIds = charityAdmins.map((ca) => ca.charityId);
    }

    return {
      user,
    };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext) {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      })
    );
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "length must be greater than 2",
          },
        ],
      };
    }

    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired",
          },
        ],
      };
    }

    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);

    if (!user) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists",
          },
        ],
      };
    }

    await User.update(
      { id: userIdNum },
      {
        password: await argon2.hash(newPassword),
      }
    );

    await redis.del(key);

    // log in user after change password
    req.session.userId = user.id;

    const charityAdmins = await Charityrolelink.find({
      where: { auditstat: true, userId: user.id },
    });

    if (charityAdmins.length > 0) {
      req.session.charityAdminIds = charityAdmins.map((ca) => ca.charityId);
    }

    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { redis }: MyContext
  ) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // the email is not in the db
      return true;
    }

    const token = v4();

    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 3
    ); // 3 days

    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );

    return true;
  }
}
