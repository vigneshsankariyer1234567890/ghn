import "reflect-metadata";
import "dotenv-safe/config";
import { COOKIE_NAME, __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { MyContext } from "./types";
import { UserResolver } from "./resolvers/user";
import cors from "cors";
import { createConnection } from "typeorm";
import { User } from "./entities/User";
import { Post } from "./entities/Post";
import { Like } from "./entities/Like";
import { createUserLoader } from "./utils/dataloaders/createUserLoader";
import { createLikesLoader } from "./utils/dataloaders/createLikesLoader";
import path from "path";
import { Usercategory } from "./entities/Usercategory";
import { Category } from "./entities/Category";
import { CategoryResolver } from "./resolvers/category";
import {
  createCategoryLoader,
  createCharityCategoryLoader,
  createUserCategoryLoader,
} from "./utils/dataloaders/createInterestsLoader";
import { Charity } from "./entities/Charity";
import { Charitycategory } from "./entities/Charitycategory";
import { Charityrolelink } from "./entities/Charityrolelink";
import { Userrole } from "./entities/Userrole";
import { CharityResolver } from "./resolvers/charity";
import { Event } from "./entities/Event";
import { Posteventlink } from "./entities/Posteventlink";
import { Eventvolunteer } from "./entities/Eventvolunteer";
import { Task } from "./entities/Task";
import { Taskvolunteer } from "./entities/Taskvolunteer";
import { Eventlike } from "./entities/Eventlike";
import {
  createEventLikesArrayLoader,
  createEventLikesLoader,
} from "./utils/dataloaders/createEventLikesLoader";
import { EventResolver } from "./resolvers/event";
import { createCharityLoader } from "./utils/dataloaders/createCharityLoader";
import { Charityfollow } from "./entities/Charityfollow";
import {
  createCEventsLoader,
  createEventLoader,
} from "./utils/dataloaders/createEventLoader";
import { EventvolunteerResolver } from "./resolvers/eventVolunteer";
import { TaskResolver } from "./resolvers/task";
import { TaskVolunteerResolver } from "./resolvers/taskVolunteer";
import { createEventVolunteerLoader } from "./utils/dataloaders/createEventVolunteerLoader";
import { createUserVolunteeredEventsListLoader } from "./utils/dataloaders/createEventVolunteerListLoader";
import { createTaskListLoader } from "./utils/dataloaders/createTaskListLoader";
import { createTaskVolunteerListLoader } from "./utils/dataloaders/createTaskVolunteerListLoader";
import { Userfriend } from "./entities/Userfriend";
import {
  createCharityFollowersLoader,
  createSingleCharityFollowLoader,
  createUserCharityFollowsLoader,
} from "./utils/dataloaders/createCharityFollowLoader";
import { createCharityAdminRolesLoader } from "./utils/dataloaders/createCharityAdminRoleLoader";
import { createUserFriendshipLoader, createUserFriendsLoader } from "./utils/dataloaders/createUserFriendLoader";

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [
      Post,
      User,
      Like,
      Usercategory,
      Category,
      Charity,
      Charitycategory,
      Charityrolelink,
      Userrole,
      Event,
      Posteventlink,
      Eventvolunteer,
      Task,
      Taskvolunteer,
      Eventlike,
      Charityfollow,
      Userfriend,
    ],
  });

  // await conn.runMigrations(); // (from npx typeorm migration:generate -n MigrationName)
  // await Charity.delete({});
  // await conn.createQueryBuilder()
  //           .update(Post)
  //           .set({likeNumber: 0})
  //           .where("id = :id", { id: 6})
  //           .execute();
  // await conn.createQueryRunner().query(`INSERT INTO "userrole" ("roleName") VALUES ('ADMIN')`);
  // await conn.createQueryRunner().query(`INSERT INTO "userrole" ("roleName") VALUES ('VOLUNTEER')`);
  // console.log(await Userrole.find()); // remember that primary key generation starts from 1
  // console.log(await Category.find());
  // console.log(await Charityrolelink.find());

  const app = express();

  const RedisStore = connectRedis(session);

  const redis = new Redis(process.env.REDIS_URL);

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: process.env.CORS.split(" "),
      credentials: true,
    })
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365, //1 year
        httpOnly: true,
        secure: __prod__,
        sameSite: __prod__ ? "none" : "lax",
        domain: __prod__ ? ".givehub.club" : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [
        HelloResolver,
        PostResolver,
        UserResolver,
        CategoryResolver,
        CharityResolver,
        EventResolver,
        EventvolunteerResolver,
        TaskResolver,
        TaskVolunteerResolver,
      ],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      likeLoader: createLikesLoader(),
      categoryLoader: createCategoryLoader(),
      charityCategoryLoader: createCharityCategoryLoader(),
      userCategoryLoader: createUserCategoryLoader(),
      eventLikeLoader: createEventLikesLoader(),
      userEventLikesLoader: createEventLikesArrayLoader(),
      charityLoader: createCharityLoader(),
      eventLoader: createEventLoader(),
      charityEventsLoader: createCEventsLoader(),
      eventVolunteerLoader: createEventVolunteerLoader(),
      userTaskListLoader: createTaskListLoader(),
      taskVolunteerListLoader: createTaskVolunteerListLoader(),
      singleCharityFollowLoader: createSingleCharityFollowLoader(),
      charityFollowersLoader: createCharityFollowersLoader(),
      userCharityFollowsLoader: createUserCharityFollowsLoader(),
      charityAdminRoleLoader: createCharityAdminRolesLoader(),
      userFriendsLoader: createUserFriendsLoader(),
      userFriendshipLoader: createUserFriendshipLoader(),
      userVolunteeredEventsListLoader: createUserVolunteeredEventsListLoader()
    }),
    playground: true,
    introspection: true,
  });

  apolloServer.applyMiddleware({
    app,
    cors: false,
  });

  app.listen(parseInt(process.env.PORT), () => {
    console.log(`server started on ${parseInt(process.env.PORT)}}`);
  });
};

main().catch((err) => console.log(err));
