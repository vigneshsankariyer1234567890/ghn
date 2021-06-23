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
import { createUserLoader } from "./utils/createUserLoader";
import { createLikesLoader } from "./utils/createLikesLoader";
import path from "path";
import { Usercategory } from "./entities/Usercategory";
import { Category } from "./entities/Category";
import { CategoryResolver } from "./resolvers/category";
import { createCategoryLoader } from "./utils/createInterestsLoader";
import { Charity } from "./entities/Charity";
import { Charitycategory } from "./entities/Charitycategory";
import { Charityrolelink } from "./entities/Charityrolelink";
import { Userrole } from "./entities/Userrole";
import { CharityResolver } from "./resolvers/charity";

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [Post, User, Like, Usercategory, Category, Charity, Charitycategory, Charityrolelink, Userrole],
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
            

  const app = express();

  const RedisStore = connectRedis(session); 

  const redis = new Redis(process.env.REDIS_URL);

  app.set("trust proxy", 1);

  app.use(
    cors({
      origin: 
      [
        "http://119.74.239.145",
        "http://116.87.51.173",
        "https://givehub.vercel.app",
        "http://localhost:3000",
        "http://localhost:4000"
      ],
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
        sameSite: "none",
        domain: __prod__ ? ".givehub.club" : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver, CategoryResolver, CharityResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      likeLoader: createLikesLoader(),
      categoryLoader: createCategoryLoader()
    }),
    playground: true,
    introspection: true
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
