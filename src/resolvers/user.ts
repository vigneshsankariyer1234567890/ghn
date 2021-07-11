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
  UseMiddleware,
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
// import { Usercategory } from "../entities/Usercategory";
import { Charity } from "../entities/Charity";
// import { Charityfollow } from "../entities/Charityfollow";
import { Charityrolelink } from "../entities/Charityrolelink";
import { Event } from "../entities/Event";
// import { Eventlike } from "../entities/Eventlike";
import { isAuth } from "../middleware/isAuth";
import {
  EventTaskContainer,
  EventTaskContainerResponse,
} from "../utils/cardContainers/EventTaskContainer";
import { Eventvolunteer } from "../entities/Eventvolunteer";
import { Task } from "../entities/Task";
import { Taskvolunteer } from "../entities/Taskvolunteer";
import { FriendRequestStatus, Userfriend } from "../entities/Userfriend";

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

  @Field(() => [User], { nullable: true })
  userList?: User[];

  @Field(() => Boolean)
  success: boolean;
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
  async categories(
    @Root() user: User,
    @Ctx() { categoryLoader, userCategoryLoader }: MyContext
  ) {
    const usercategories = await userCategoryLoader.load(user.id);

    if (usercategories.length < 1) {
      return [];
    }

    const catids = usercategories.map((uc) => uc.categoryId);

    return await categoryLoader.loadMany(catids);
  }

  @FieldResolver(() => [Charity])
  async followedCharities(
    @Root() user: User,
    @Ctx() { charityLoader, userCharityFollowsLoader }: MyContext
  ): Promise<(Charity | Error)[]> {
    const charityfollows = await userCharityFollowsLoader.load(user.id);

    if (!charityfollows) {
      return [];
    }

    const charIds = charityfollows.map((cf) => cf.charityId);

    return await charityLoader.loadMany(charIds);
  }

  @FieldResolver(() => [Charity])
  async adminCharities(
    @Root() user: User,
    @Ctx() { charityLoader, charityAdminRoleLoader }: MyContext
  ): Promise<(Charity | Error)[]> {
    // n+1 problem, n posts, n sql queries executed
    // return User.findOne(post.creatorId);

    // using dataloader
    const crls = await charityAdminRoleLoader.load(user.id);

    if (!crls) {
      return [];
    }

    const charIds = crls.map((cf) => cf.charityId);

    return await charityLoader.loadMany(charIds);
  }

  @FieldResolver(() => [Event])
  async likedEvents(
    @Root() user: User,
    @Ctx() { eventLoader, userEventLikesLoader }: MyContext
  ): Promise<(Event | Error)[]> {
    const likedEvents = await userEventLikesLoader.load(user.id);

    if (!likedEvents) {
      return [];
    }

    const eventIds = likedEvents.map((le) => le.eventId);

    return await eventLoader.loadMany(eventIds);
  }

  @FieldResolver(() => [Event])
  async volunteeredEvents(
    @Root() user: User,
    @Ctx() { eventLoader, userVolunteeredEventsListLoader }: MyContext
  ): Promise<(Event | Error)[]> {
    const likedEvents = await userVolunteeredEventsListLoader.load(user.id);

    if (!likedEvents) {
      return [];
    }

    const eventIds = likedEvents.map((le) => le.eventId);

    return await eventLoader.loadMany(eventIds);
  }

  @UseMiddleware(isAuth)
  @FieldResolver(() => [User])
  async friends(
    @Root() user: User,
    @Ctx() { userLoader, userFriendsLoader, req }: MyContext
  ): Promise<(User | Error)[]> {
    if (!req.session.userId) {
      return [];
    }

    const friends = await userFriendsLoader.load(user.id);

    if (!friends) {
      return [];
    }

    const userids = friends.map((f) =>
      f.user1Id === user.id ? f.user2Id : f.user1Id
    );

    return await userLoader.loadMany(userids);
  }

  @UseMiddleware(isAuth)
  @FieldResolver(() => FriendRequestStatus, { nullable: true })
  async friendStatus(
    @Root() user: User,
    @Ctx() { req, userFriendshipLoader }: MyContext
  ): Promise<FriendRequestStatus | null> {
    if (!req.session.userId) {
      return null;
    }

    const fr = await userFriendshipLoader.load({
      user1Id: user.id,
      user2Id: req.session.userId,
    });

    if (!fr) {
      return null;
    }

    return fr.friendreqstatus;
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
      return { success: false, errors };
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
          success: false,
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

    return { success: true, user };
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
        success: false,
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
        success: false,
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
      success: true,
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
        success: false,
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
        success: false,
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
        success: false,
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

    return { success: true, user };
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
      `<a href="https://givehub.vercel.app/change-password/${token}">reset password</a>`
    );

    return true;
  }

  @Query(() => EventTaskContainerResponse)
  @UseMiddleware(isAuth)
  async viewTasksAssignedToMe(
    @Ctx() { req }: MyContext
  ): Promise<EventTaskContainerResponse> {
    if (!req.session.userId) {
      return { success: false };
    }

    // get the events I am part of
    const eventarray = await getConnection()
      .createQueryBuilder()
      .select(`e.*`)
      .from(Event, `e`)
      .innerJoin(Eventvolunteer, `ev`, `e.id = ev."eventId"`)
      .where(`e.completed = false`)
      .andWhere(`e.auditstat = true`)
      .andWhere(`ev."userId" = :uid`, { uid: req.session.userId })
      .andWhere(`ev.adminapproval = 'approved'`)
      .andWhere(`ev.auditstat = true`)
      .andWhere(`ev."volunteeringCompleted" = false`)
      .getRawMany<Event>();

    // get the tasks assigned to me
    const taskarray = await getConnection()
      .createQueryBuilder()
      .select(`t.*`)
      .from(Task, `t`)
      .innerJoin(Taskvolunteer, `tv`, `t.id = tv."taskId"`)
      .where(`t.auditstat = true`)
      .andWhere(`t.completionstatus <> 'completed'`)
      .andWhere(`tv."userId" = :uid`, { uid: req.session.userId })
      .andWhere(`tv.auditstat = true`)
      .getRawMany<Task>();

    // map each event to array of tasks
    const evhashmap: Record<number, Task[]> = {};

    eventarray.forEach((e) => {
      const filteredtasks = taskarray.filter((t) => t.eventId === e.id);
      evhashmap[e.id] = filteredtasks;
    });

    // map each event in event array to become EventTaskContainer
    const evcontainers: EventTaskContainer[] =
      eventarray.map<EventTaskContainer>((eve) => {
        const tasks = evhashmap[eve.id];
        return new EventTaskContainer(eve, tasks);
      });

    // return EventTaskContainerResponse
    return { success: true, eventContainers: evcontainers };
  }

  @Query(() => UserResponse)
  @UseMiddleware(isAuth)
  async viewMyPendingFriendRequests(
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User not logged in." }],
      };
    }

    // get Userfriends
    const friends = await getConnection()
      .createQueryBuilder()
      .select(`uf.*`)
      .from(Userfriend, `uf`)
      .where(
        `uf."user1Id" = ${req.session.userId} or uf."user2Id" = ${req.session.userId}`
      )
      .andWhere(
        `uf.friendreqstatus = ${FriendRequestStatus.USER1_REQ} or uf.friendreqstatus = ${FriendRequestStatus.USER2_REQ}`
      )
      .getRawMany<Userfriend>();

    const uids = friends.map((f) =>
      f.user1Id === req.session.userId ? f.user2Id : f.user1Id
    );

    const userFriends = await User.findByIds(uids);

    return {
      success: true,
      userList: userFriends,
    };
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async requestFriend(
    @Arg("userId", () => Number) userId: number,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User not authenticated." }],
      };
    }

    if (req.session.userId === userId) {
      return {
        success: false,
        errors: [
          {
            field: "Friend Choice",
            message: "You cannot send yourself a friend request.",
          },
        ],
      };
    }

    const bigger = userId > req.session.userId;

    const userfriend = await Userfriend.findOne({
      where: {
        user1Id: bigger ? req.session.userId : userId,
        user2Id: bigger ? userId : req.session.userId,
      },
    });

    if (userfriend) {
      if (userfriend.friendreqstatus === FriendRequestStatus.ACCEPTED) {
        return {
          success: false,
          errors: [
            {
              field: "Friend",
              message: "You are already friends.",
            },
          ],
        };
      }

      if (
        userfriend.friendreqstatus === FriendRequestStatus.BLOCKED_USER1 ||
        userfriend.friendreqstatus === FriendRequestStatus.BLOCKED_USER2
      ) {
        return {
          success: false,
          errors: [
            {
              field: "Friend",
              message: "You have either been blocked or have blocked the user.",
            },
          ],
        };
      }

      if (
        userfriend.friendreqstatus === FriendRequestStatus.USER1_REQ ||
        userfriend.friendreqstatus === FriendRequestStatus.USER2_REQ
      ) {
        return {
          success: false,
          errors: [
            {
              field: "Friend",
              message: "There is already a pending friend request.",
            },
          ],
        };
      }

      if (userfriend.friendreqstatus === FriendRequestStatus.REJECTED) {
        await userfriend.remove();
      }
    }

    await getConnection().transaction(async (tm) => {
      await tm
        .createQueryBuilder()
        .insert()
        .into(Userfriend)
        .values({
          user1Id: bigger ? req.session.userId : userId,
          user2Id: bigger ? userId : req.session.userId,
          friendreqstatus: bigger
            ? FriendRequestStatus.USER1_REQ
            : FriendRequestStatus.USER2_REQ,
        })
        .execute();
    });

    return { success: true };
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async acceptFriendRequest(
    @Arg("userId", () => Number) userId: number,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User not authenticated." }],
      };
    }

    if (req.session.userId === userId) {
      return {
        success: false,
        errors: [
          {
            field: "Friend Choice",
            message: "You cannot send yourself a friend request.",
          },
        ],
      };
    }

    const bigger = userId > req.session.userId;

    const userfriend = await Userfriend.findOne({
      where: {
        user1Id: bigger ? req.session.userId : userId,
        user2Id: bigger ? userId : req.session.userId,
      },
    });

    if (!userfriend) {
      return {
        success: false,
        errors: [
          {
            field: "Friend Request",
            message: "You need to send a friend request first.",
          },
        ],
      };
    }

    if (userfriend.friendreqstatus === FriendRequestStatus.ACCEPTED) {
      return {
        success: false,
        errors: [
          {
            field: "Friend",
            message: "You are already friends.",
          },
        ],
      };
    }

    if (
      userfriend.friendreqstatus === FriendRequestStatus.BLOCKED_USER1 ||
      userfriend.friendreqstatus === FriendRequestStatus.BLOCKED_USER2
    ) {
      return {
        success: false,
        errors: [
          {
            field: "Friend",
            message: "You have either been blocked or have blocked the user.",
          },
        ],
      };
    }

    if (userfriend.friendreqstatus === FriendRequestStatus.REJECTED) {
      await userfriend.remove();
      return {
        success: false,
        errors: [
          {
            field: "Friend",
            message: "You need to send a friend request first.",
          },
        ],
      };
    }

    if (
      (bigger &&
        userfriend.friendreqstatus === FriendRequestStatus.USER1_REQ) ||
      (!bigger && userfriend.friendreqstatus === FriendRequestStatus.USER2_REQ)
    ) {
      return {
        success: false,
        errors: [
          {
            field: "Friend",
            message: "User has to accept your friend request.",
          },
        ],
      };
    }

    userfriend.friendreqstatus = FriendRequestStatus.ACCEPTED;
    await userfriend.save();

    return { success: true };
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async blockUser(
    @Arg("userId", () => Number) userId: number,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User not authenticated." }],
      };
    }

    if (req.session.userId === userId) {
      return {
        success: false,
        errors: [
          {
            field: "Friend Choice",
            message: "You cannot send yourself a friend request.",
          },
        ],
      };
    }

    const bigger = userId > req.session.userId;

    const userfriend = await Userfriend.findOne({
      where: {
        user1Id: bigger ? req.session.userId : userId,
        user2Id: bigger ? userId : req.session.userId,
      },
    });

    if (!userfriend) {
      await getConnection().transaction(async (tm) => {
        await tm
          .createQueryBuilder()
          .insert()
          .into(Userfriend)
          .values({
            user1Id: bigger ? req.session.userId : userId,
            user2Id: bigger ? userId : req.session.userId,
            friendreqstatus: bigger
              ? FriendRequestStatus.BLOCKED_USER1
              : FriendRequestStatus.BLOCKED_USER2,
          });
      });
      return { success: true };
    }

    if (
      userfriend.friendreqstatus === FriendRequestStatus.BLOCKED_USER1 ||
      userfriend.friendreqstatus === FriendRequestStatus.BLOCKED_USER2
    ) {
      return { success: true };
    }

    userfriend.friendreqstatus = bigger
      ? FriendRequestStatus.BLOCKED_USER1
      : FriendRequestStatus.BLOCKED_USER2;
    userfriend.save();

    return { success: true };
  }
}
