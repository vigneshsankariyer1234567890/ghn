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
import { PostLikeResponse } from "../utils/cardContainers/LikeResponse";
import { Event } from "../entities/Event";

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

  @FieldResolver(() => Boolean)
  async likeStatus(@Root() post: Post, @Ctx() { likeLoader, req }: MyContext): Promise<Boolean> {
    if (!req.session.userId) {
      return false;
    }

    const like = await likeLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });

    return like ? true : false;
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

  @Mutation(() => PostLikeResponse)
  @UseMiddleware(isAuth)
  async likePost(
    @Arg("postId", () => Int) postId: number,
    @Ctx() { req }: MyContext
  ): Promise<PostLikeResponse> {
    const { userId } = req.session;

    const post = await Post.findOne({ where: { id: postId, auditstat: true } });

    if (!post) {
      return {
        success: false,
        errors: [{ field: "Post", message: "That post does not exist." }],
      };
    }

    const like = await Like.findOne({ where: { postId, userId } });

    // user has liked post before and unliking the post
    if (like) {
      await getConnection().transaction(async (tm) => {
        //to change later to auditStat = 10

        await tm.delete(Like, { userId: userId, postId: postId });

        if (post.likeNumber > 0) {
          post.likeNumber = post.likeNumber - 1;
        }

        await post.save();
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

        post.likeNumber = post.likeNumber + 1;
        await post.save();
      });
    }

    const pel = await Posteventlink.findOne({postId: post.id, auditstat: true});

    if (!pel) {
      return {success: true, likeItem: new EPost(post)}
    }

    const event = await Event.findOne({id: pel.id})

    return {success: true, likeItem: new EPost(post, event)};
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() { }: MyContext
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
      posts
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
    @Ctx() { eventLoader }: MyContext
  ): Promise<EPost | undefined> {
    const p = await Post.findOne(id);
    if (!p) {
      return undefined;
    }
    if (!p.isEvent) {
      return {post: p};
    }
    const pel = await Posteventlink.findOne({where: {postId: p.id, auditstat: true}});

    if (!pel) {
      return {post: p};
    }

    const event = await eventLoader.load(pel.eventId);

    return {
      post: p,
      event: event
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
    return { post: p};
  }

  @Mutation(() => EPost, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id") id: number,
    // @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<EPost | null> {
    const result = await getConnection()
      .createQueryBuilder()
      .update(Post)
      .set({ text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning("*")
      .execute();
    
    return {
      post: result.raw[0]
    };
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
        .from(Like)
        .where(`"postId" = :post`, { post: id })
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
      .from(Like)
      .where(`l."postId" in (:...posts)`, { posts: postIds })
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
