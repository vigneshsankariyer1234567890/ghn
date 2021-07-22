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
  Int,
} from "type-graphql";
import { MyContext } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import {
  UsernamePasswordInput,
  UserProfileUpdateInput,
} from "../utils/UsernamePasswordInput";
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
import { PaginatedUsers } from "../utils/cardContainers/PaginatedCharitiesAndUsers";
import { Userprofile } from "../entities/Userprofile";
import { CategoryResolver } from "./category";
import { checkTelegramUsername } from "../utils/telegramUtils/checkTelegramUsername";
import { EPost } from "../utils/cardContainers/PostInput";

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

  @Field(() => Int, {nullable: true})
  timeout?: number

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

  @FieldResolver(() => Userprofile, { nullable: true })
  async profile(
    @Root() user: User,
    @Ctx() { userProfileLoader }: MyContext
  ): Promise<Userprofile | null> {
    return await userProfileLoader.load(user.id);
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

  @FieldResolver(() => [User])
  async friends(
    @Root() user: User,
    @Ctx() { userLoader, userFriendsLoader }: MyContext
  ): Promise<(User | Error)[]> {
    // if (!req.session.userId) {
    //   return [];
    // }

    const friends = await userFriendsLoader.load(user.id);

    if (!friends) {
      return [];
    }

    const userids = friends.map((f) =>
      f.user1Id === user.id ? f.user2Id : f.user1Id
    );

    return await userLoader.loadMany(userids);
  }

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

  @FieldResolver(() => Boolean)
  async viewerStatus(
    @Root() user: User,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    if (!req.session.userId) {
      return false;
    }

    if (user.id !== req.session.userId) {
      return false;
    }

    return true;
  }

  @FieldResolver(() => [EPost], {nullable: true})
  async posts(
    @Root() user: User,
    @Ctx() { userPostsLoader }: MyContext
  ): Promise<EPost[] | null> {
    const posts = await userPostsLoader.load(user.id);
    return posts;
    
  }

  @FieldResolver(() => Int)
  async friendNumber(
    @Root() user: User,
    @Ctx() { userFriendsLoader }: MyContext
  ): Promise<number> {
    const friends = await userFriendsLoader.load(user.id);
    if (!friends) {
      return 0;
    }
    return friends.length
  }

  @FieldResolver(() => Int)
  async followedCharitiesNumber(
    @Root() user: User,
    @Ctx() {userCharityFollowsLoader}: MyContext
  ): Promise<number> {
    const follows = await userCharityFollowsLoader.load(user.id);
    if (!follows) {
      return 0;
    }
    return follows.length;
  }

  @FieldResolver(() => [User])
  async mutualFriends(
    @Root() user: User,
    @Ctx() { userLoader, mutualFriendsLoader, req }: MyContext
  ): Promise<(User | Error)[]> {
    if (!req.session.userId) {
      return [];
    }

    if (req.session.userId === user.id) {
      return [];
    }

    const uids = await mutualFriendsLoader.load({user1Id: user.id, user2Id: req.session.userId});
    
    if (!uids) {
      return [];
    }

    if (uids.length === 0) {
      return [];
    }
    return await userLoader.loadMany(uids);
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    // you are not logged in
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  @Query(() => User, { nullable: true })
  user(@Arg("id") id: number):Promise<User | undefined> {
    // you are not logged in

    return User.findOne(id);
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
    if (req.session.userId) {
      return {
        success: false,
        errors: [
          {
            field: "User",
            message:
              "You are already logged in. Please log out if you wish to log in as another user.",
          },
        ],
      };
    }
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

  @UseMiddleware(isAuth)
  @Mutation(() => UserResponse)
  async updateUserProfile(
    @Arg("options") options: UserProfileUpdateInput,
    @Ctx() { req }: MyContext
  ): Promise<UserResponse> {
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User not authenticated." }],
      };
    }

    const user = await User.findOne(req.session.userId);

    if (!user) {
      return {
        success: false,
        errors: [
          { field: "Fatal", message: "Please contact the Givehub Developers." }, 
        ],
      };
    }

    if (options.telegramHandle) {
      const res = checkTelegramUsername(options.telegramHandle);
      if (!res.success) {
        return {
          success: res.success,
          errors: res.errors,
          timeout: res.timeout
        }
      };
    } 

    if (options.categories) {
      const resp = await CategoryResolver.updateUserCategories({categories: options.categories}, user.id);
      if (!resp.success) {
        return {
          success: false,
          errors: resp.errors
        }
      }
    }

    if (options.email !== user.email) {
      user.email = options.email;
    }

    const userprof = await getConnection()
      .createQueryBuilder()
      .select()
      .from(Userprofile, `up`)
      .where(`up."userId" = :uid`, { uid: user.id })
      .getRawOne<Userprofile>();

    if (!userprof) {
      await Userprofile.create({
        user: user,
        about: options.about,
        gender: options.gender,
        firstName: options.firstName,
        lastName: options.lastName,
        telegramHandle: options.telegramHandle,
        displayPicture: options.displayPicture
      }).save();
    } else {
      const ogtele = userprof.telegramHandle;
      const inputtele = options.telegramHandle;
      const dp = !(userprof.displayPicture)
      const newdp = !(options.displayPicture)
      if (!ogtele) {
        await getConnection().transaction(async (tm) => {
          await tm
            .createQueryBuilder()
            .update(Userprofile)
            .set({
              about: options.about,
              gender: options.gender,
              firstName: options.firstName,
              lastName: options.lastName,
              telegramHandle: inputtele,
              displayPicture: dp ? options.displayPicture : newdp ? userprof.displayPicture : options.displayPicture
            })
            .where(`"userId" = :uid`, { uid: user.id })
            .execute();
        });
        await user.save();
        return { success: true, user: user };
      }
      if (!inputtele) {
        await getConnection().transaction(async (tm) => {
          await tm
            .createQueryBuilder()
            .update(Userprofile)
            .set({
              about: options.about,
              gender: options.gender,
              firstName: options.firstName,
              lastName: options.lastName,
              displayPicture: dp ? options.displayPicture : newdp ? userprof.displayPicture : options.displayPicture
            })
            .where(`"userId" = :uid`, { uid: user.id })
            .execute();
        });
        await user.save();
        return { success: true, user: user };
      }
      // update User profile first
      await getConnection().transaction(async (tm) => {
        await tm
          .createQueryBuilder()
          .update(Userprofile)
          .set({
            about: options.about,
            gender: options.gender,
            firstName: options.firstName,
            lastName: options.lastName,
            telegramHandle: inputtele,
            displayPicture: dp ? options.displayPicture : newdp ? userprof.displayPicture : options.displayPicture
          })
          .where(`"userId" = :uid`, { uid: user.id })
          .execute();
      });
      // update joined telegram to false and set date as null 
      // since new telegram handle added
      if (inputtele !== ogtele ) {
        await getConnection().transaction(async (tm) => {
          await tm
            .createQueryBuilder()
            .update(Eventvolunteer)
            .set({
              joinedTelegram: false,
              joinedTelegramDate: undefined
            })
            .where(`"userId" = :uid`, {uid: user.id})
            .execute()
        })
      }
    }

    await user.save();

    return { success: true, user: user };
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
        `uf.friendreqstatus = 'user1_req' or uf.friendreqstatus = 'user2_req'`
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
      if (userfriend.friendreqstatus === FriendRequestStatus.ACCEPTED
          || userfriend.friendreqstatus === FriendRequestStatus.USER1_REQ ||
          userfriend.friendreqstatus === FriendRequestStatus.USER2_REQ
        ) {
        await userfriend.remove();
        return {
          success: true
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
              message: "Unable to send a friend request.",
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
    @Arg("accept") accept: boolean,
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

    userfriend.friendreqstatus = accept ? FriendRequestStatus.ACCEPTED : FriendRequestStatus.REJECTED;
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

  @Query(() => PaginatedUsers)
  async searchUsers(
    @Arg("limit", () => Int) limit: number,
    // @Arg("categories", () => [Number]) categories: number[],
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Arg("input", () => String, { nullable: true }) input: string | null
  ): Promise<PaginatedUsers> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    // const catcsv = categories
    //   .reduce<string>((a, b) => a + b + `,`, ``)
    //   .slice(0, -1);

    // actual query
    const users = await getConnection().query(
      `
      SELECT * FROM "user" us
      ${input ? `where us."username" ILIKE '` + input + `%'` : ""}
      ${
        cursor
          ? input
            ? `and us."username" > '` + cursor + `'`
            : `where us."username" > '` + cursor + `'`
          : ""
      }
      order by us."username" ASC
      limit ${realLimitPlusOne}
      `
    );

    const tot = await getConnection().query(
      `
      select COUNT(*) as "count" from (
        SELECT * FROM "user" us
        ${input ? `where us."username" ILIKE '` + input + `%'` : ""}
      ) c
      `
    );

    return {
      items: users.slice(0, realLimit),
      hasMore: users.length === realLimitPlusOne,
      total: parseInt(tot[0].count),
    };
  }
}
