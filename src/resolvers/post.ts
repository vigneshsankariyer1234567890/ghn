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
import { PaginatedPosts, PostInput, EPost } from "../utils/cardContainers/PostInput";
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
        // await tm.query(
        //   `
        //         update "like" 
        //         set auditstat = false
        //         where id = $1
        //     `,
        //   [like.id]
        // );

        await tm.delete(Like, {userId: userId, postId: postId});

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
        // await tm.query(
        //   `
        //     insert into "like" ("userId", "postId")
        //     values ($1, $2)
        //   `,
        //   [userId, postId]
        // );

        await tm.createQueryBuilder().insert().into(Like).values({userId: userId, postId: postId}).execute()

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
    return (like) ? false : true;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    // @Arg("sortByLikes") sortByLikes: boolean,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    let date:Date;

    if (cursor) {
      date = new Date(parseInt(cursor));
    } else {
      date = new Date(Date.now());
      date = new Date(date.setHours(date.getHours() + 8));
    }

    // const date = cursor ? new Date(cursor) : new Date(Date.now());

    // actual query
    const posts 
    // = await getConnection().query(
    //   `
    // select p.*
    // from post p 
    // where p.auditstat = true
    // ${cursor ? `and p."createdAt" < $2` : ""}
    // order by 
    //   ${sortByLikes ? `p."likeNumber" DESC,` : ""}
    //   p."createdAt" DESC
    // limit $1
    // `,
    //   replacements
    // );
     = await getConnection()
     .createQueryBuilder(Post, `po`)
     .select(`po.*`)
     .where(`po.auditstat = true`)
     .andWhere(`po."createdAt" < :cursor::timestamp`, { cursor: date })
     .orderBy(`po."createdAt"`, `DESC`)
     .limit(realLimitPlusOne)
     .getRawMany<Post>();

    const eposts = await PaginatedPosts.convertPostsToEPosts(posts);

    return {
      posts: eposts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => EPost, { nullable: true })
  async post(@Arg("id", () => Int) id: number): Promise<EPost | undefined> {
    const p = await Post.findOne(id);
    if (!p) {
      return undefined;
    }
    if (!(p.isEvent)) {
      return {post: p, isEvent: p.isEvent};
    }
    const eventinfo = await getConnection()
    .createQueryBuilder()
    .select('pel."postId"', "postid")
    .addSelect('pel."eventId"')
    .addSelect('pel."eventName"')
    .from(Post, "po")
    .leftJoin(Posteventlink, "pel", 'pel."postId" = po.id')
    .where('po.id IN (:...ids)', {ids: [p.id]})
    .getRawOne<{postid: number, eventId?: number, eventName?: string}>()
    
    return {post: p, isEvent: p.isEvent, eventId: eventinfo.eventId, eventName: eventinfo.eventName};
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
    return {post: p, isEvent:false}
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg("id") id: number,
    @Arg("title") title: string,
    @Arg("text") text: string,
    @Ctx() { req }: MyContext
  ): Promise<Post | null> {
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

    return result.raw[0];

    // return Post.update({ id, creatorId: req.session.userId }, { title, text});
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id") id: number,
    @Ctx() { req }: MyContext
  ): Promise<boolean> {
    // not cascade way
    // const post = await Post.findOne(id)
    // if (!post) {
    //     return false;
    // }
    // if (post.creatorId !== req.session.userId) {
    //     throw new Error('not authorized');
    // }
    
    // await Post.delete({ id, creatorId: req.session.userId});

    // cascade
    // await Post.delete({ id, creatorId: req.session.userId });
    // change to mark posts as deleted, then mark all Likes to deleted
    await getConnection().transaction(async (tm) => {
      tm.query(`
        update post 
        set auditstat = false
        where id = $1 and "creatorId" = $2
      `, [id, req.session.userId]);
    })

    await getConnection().transaction(async (tm) => {
      await tm.createQueryBuilder()
        .delete()
        .from(Like, `l`)
        .where(`l."postId" = :post`, {post: id})
        .execute()
    })

    // await getConnection().transaction(async(tm) => {
    //   tm.query(`
    //     update "like" 
    //     set auditstat = false
    //     where "postId" = $1
    //   `, [id]);
    // })

    await getConnection().transaction(async(tm) => {
      tm.query(`
        update posteventlink 
        set auditstat = false
        where "postId" = $1
      `, [id]);
    })

    return true;
  }
}

export async function deletePosts(postIds: number[]): Promise<void> {
  await getConnection().transaction(async (tm) => {
    tm.query(`
    UPDATE "post" AS p 
    SET auditstat = false
    FROM (select unnest(string_to_array($1,',')::int[]) as postId ) AS pid
    WHERE p.id = pid.postId
    `, [postIds.reduce<string>((a,b) => a + b + `,`,``).slice(0,-1)]);
  })

  // await getConnection().transaction(async (tm) => {
  //   tm.query(`
  //   UPDATE "like" AS l 
  //   SET auditstat = false
  //   FROM (select unnest(string_to_array($1,',')::int[]) as postId ) AS pid
  //   WHERE l."postId" = pid.postId
  //   `, [postIds.reduce<string>((a,b) => a + b + `,`,``).slice(0,-1)]);
  // })

  await getConnection().transaction(async (tm) => {
    await tm.createQueryBuilder()
      .delete()
      .from(Like, `l`)
      .where(`l."postId" in (:posts)`, {posts: postIds})
      .execute()
  })

  await getConnection().transaction(async (tm) => {
    tm.query(`
    UPDATE posteventlink AS pel 
    SET auditstat = false
    FROM (select unnest(string_to_array($1,',')::int[]) as postId ) AS pid
    WHERE pel."postId" = pid.postId
    `, [postIds.reduce<string>((a,b) => a + b + `,`,``).slice(0,-1)])
  });

  return
}
