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

const main = async () => {
  const conn = await createConnection({
    type: "postgres",
    url: process.env.DATABASE_URL,
    logging: true,
    // synchronize: true,
    migrations: [path.join(__dirname, "./migrations/*")],
    entities: [Post, User, Like],
  });

  await conn.runMigrations(); // (from npx typeorm migration:generate -n MigrationName)

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  app.set("proxy", 1);

  app.use(
    cors({
      origin: [
        "http://119.74.239.145",
        "http://116.87.51.173",
        "https://givehub-next-client.vercel.app",
        "http://localhost:3000",
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
        sameSite: "lax",
        domain: __prod__ ? ".ghserver.com" : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    })
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }): MyContext => ({
      req,
      res,
      redis,
      userLoader: createUserLoader(),
      likeLoader: createLikesLoader(),
    }),
    playground: true
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
