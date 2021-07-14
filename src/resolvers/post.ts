import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entities/Post";
import { Like } from "../entities/Like";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import {
  PaginatedPosts,
  PostInput,
  EPost,
} from "../utils/cardContainers/PostInput";
import { Posteventlink } from "../entities/Posteventlink";

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() post: Post) {
    return post.text.slice(0, 50);
  }

  @FieldResolver(() => User)
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(@Root() post: Post, @Ctx() { likeLoader, req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    const like = await likeLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });

    return like ? 1 : null;
  }

  @FieldResolver(() => Boolean)
  async creatorStatus(
    @Root() post: Post,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    if (!req.session.userId) {
      return false;
    }

    if (post.creatorId !== req.session.userId) {
      return false;
    }

    return true;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async likePost(
    @Arg("postId", () => Int) postId: number,
    @Ctx() { req }: MyContext
  ) {
    const { userId } = req.session;

    const like = await Like.findOne({ where: { postId, userId } });

    // user has liked post before and unliking the post
    if (like) {
      await getConnection().transaction(async (tm) => {
        //to change later to auditStat = 10

        await tm.delete(Like, { userId: userId, postId: postId });

        await tm.query(
          `
                update post 
                set "likeNumber" = "likeNumber" - 1
                where id = $1
                and "likeNumber">0
            `,
          [postId]
        );
      });
    } else if (!like) {
      //has never liked before
      await getConnection().transaction(async (tm) => {
        await tm
          .createQueryBuilder()
          .insert()
          .into(Like)
          .values({ userId: userId, postId: postId })
          .execute();

        await tm.query(
          `
                update post 
                set "likeNumber" = "likeNumber" + 1
                where id = $1
            `,
          [postId]
        );
      });
    }
    return like ? false : true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    // @Arg("sortByLikes") sortByLikes: boolean,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { req }: MyContext
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    let date: Date;

    if (cursor) {
      date = new Date(parseInt(cursor));
    } else {
      date = new Date(Date.now());
      date = new Date(date.setHours(date.getHours() + 8));
    }

    // actual query
    const posts = await getConnection()
      .createQueryBuilder(Post, `po`)
      .select(`po.*`)
      .where(`po.auditstat = true`)
      .andWhere(`po."updatedAt" < :cursor::timestamp`, { cursor: date })
      .orderBy(`po."updatedAt"`, `DESC`)
      .limit(realLimitPlusOne)
      .getRawMany<Post>();

    const eposts = await PaginatedPosts.convertPostsToEPosts(
      posts,
      req.session.userId
    );

    return {
      items: eposts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
      total: posts.length,
    };
  }

  @Query(() => EPost, { nullable: true })
  async post(
    @Arg("id", () => Int) id: number,
    @Ctx() { req }: MyContext
  ): Promise<EPost | undefined> {
    const p = await Post.findOne(id);
    if (!p) {
      return undefined;
    }
    if (!p.isEvent) {
      return {
        post: p,
        isEvent: p.isEvent,
        creatorStatus: !req.session.userId
          ? false
          : p.creatorId === req.session.userId,
      };
    }
    const eventinfo = await getConnection()
      .createQueryBuilder()
      .select('pel."postId"', "postid")
      .addSelect('pel."eventId"')
      .addSelect('pel."eventName"')
      .from(Post, "po")
      .leftJoin(Posteventlink, "pel", 'pel."postId" = po.id')
      .where("po.id IN (:...ids)", { ids: [p.id] })
      .getRawOne<{ postid: number; eventId?: number; eventName?: string }>();

    return {
      post: p,
      isEvent: p.isEvent,
      eventId: eventinfo.eventId,
      eventName: eventinfo.eventName,
      creatorStatus: !req.session.userId
          ? false
          : p.creatorId === req.session.userId
    };
  }

  @Mutation(() => EPost)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input: PostInput,
    @Ctx() { req }: MyContext
  ): Promise<EPost> {
    const p = await Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
    return { post: p, isEvent: false, creatorStatus: true };
  }

  @Mutation(() => EPost, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<EPost | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();

    return {post:result.raw[0], isEvent: result.raw[0].isEvent, creatorStatus: true};
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id") id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    await getConnection().transaction(async (tm) => {
      tm.query(
        `
        update post 
        set auditstat = false
        where id = $1 and "creatorId" = $2
      `,
        [id, req.session.userId]
      );
    });

    await getConnection().transaction(async (tm) => {
      await tm
        .createQueryBuilder()
        .delete()
        .from(Like, `l`)
        .where(`l."postId" = :post`, { post: id })
        .execute();
    });

    await getConnection().transaction(async (tm) => {
      tm.query(
        `
        update posteventlink 
        set auditstat = false
        where "postId" = $1
      `,
        [id]
      );
    });

    return true;
  }
}

export async function deletePosts(postIds: number[]): Promise<void> {
  await getConnection().transaction(async (tm) => {
    tm.query(
      `
    UPDATE "post" AS p 
    SET auditstat = false
    FROM (select unnest(string_to_array($1,',')::int[]) as postId ) AS pid
    WHERE p.id = pid.postId
    `,
      [postIds.reduce<string>((a, b) => a + b + `,`, ``).slice(0, -1)]
    );
  });

  await getConnection().transaction(async (tm) => {
    await tm
      .createQueryBuilder()
      .delete()
      .from(Like, `l`)
      .where(`l."postId" in (:posts)`, { posts: postIds })
      .execute();
  });

  await getConnection().transaction(async (tm) => {
    tm.query(
      `
    UPDATE posteventlink AS pel 
    SET auditstat = false
    FROM (select unnest(string_to_array($1,',')::int[]) as postId ) AS pid
    WHERE pel."postId" = pid.postId
    `,
      [postIds.reduce<string>((a, b) => a + b + `,`, ``).slice(0, -1)]
    );
  });

  return;
}
