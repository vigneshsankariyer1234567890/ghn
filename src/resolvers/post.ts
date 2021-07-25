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
  PostResponse,
  PaginatedComments,
} from "../utils/cardContainers/PostInput";
import { Posteventlink } from "../entities/Posteventlink";
import { PostLikeResponse } from "../utils/cardContainers/LikeResponse";
import { Event } from "../entities/Event";
import { CommentInput } from "../utils/commentsAndThreads/CommentTree";
import { Comment } from "../entities/Comment";
// import { Thread } from "../utils/commentsAndThreads/Thread";

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
  async likeStatus(
    @Root() post: Post,
    @Ctx() { likeLoader, req }: MyContext
  ): Promise<Boolean> {
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

  @FieldResolver(() => [Comment], { nullable: true })
  async comments(
    @Root() post: Post,
    @Ctx() { postCommentsLoader }: MyContext
  ): Promise<Comment[] | undefined> {
    return await postCommentsLoader.load(post.id);
  }

  @FieldResolver(() => Int)
  async commentNumber(
    @Root() post: Post,
    @Ctx() { postCommentsLoader }: MyContext
  ): Promise<number> {
    const comms = await postCommentsLoader.load(post.id);
    if (!comms) {
      return 0;
    }
    return comms.length;
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

    const pel = await Posteventlink.findOne({
      postId: post.id,
      auditstat: true,
    });

    if (!pel) {
      return { success: true, likeItem: new EPost(post) };
    }

    const event = await Event.findOne({ id: pel.id });

    return { success: true, likeItem: new EPost(post, event) };
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Ctx() {}: MyContext
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

    const eposts = await PaginatedPosts.convertPostsToEPosts(posts);

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
      return { post: p };
    }
    const pel = await Posteventlink.findOne({
      where: { postId: p.id, auditstat: true },
    });

    if (!pel) {
      return { post: p };
    }

    const event = await eventLoader.load(pel.eventId);

    return {
      post: p,
      event: event,
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
    return { post: p };
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
      post: result.raw[0],
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

    await getConnection().transaction(async (tm) => {
      tm.query(
        `
        update comment 
        set auditstat = false
        where "postId" = $1
      `,
        [id]
      );
    });

    return true;
  }

  @Query(() => PaginatedComments)
  async postComments(
    @Arg("postId") postId: number,
    @Arg("limit") limit: number,
    @Arg("depth", () => Int, { nullable: true }) depth: number | null
  ): Promise<PaginatedComments> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const level = depth ? depth : -1;

    const comments = await getConnection()
      .createQueryBuilder()
      .select()
      .from(Comment, `co`)
      .where(`level > :lvl`, { lvl: level })
      .andWhere(`"postId" = :pid`, { pid: postId })
      .andWhere(`auditstat = true`)
      .orderBy(`"parentId"`, "ASC", "NULLS FIRST")
      .addOrderBy(`id`)
      .limit(realLimitPlusOne)
      .getRawMany<Comment>();

    return {
      items: comments.slice(0, realLimit),
      hasMore: comments.length === realLimitPlusOne,
      total: comments.length,
      success: true,
    };
  }

  @Query(() => PaginatedComments)
  async getCommentsAtRoot(
    @Arg("rootCommentId") rootCommentId: number,
    @Arg("limit") limit: number,
    @Arg("depth", () => Int, { nullable: true }) depth?: number 
  ): Promise<PaginatedComments> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const comment = await Comment.findOne({
      where: { id: rootCommentId, auditstat: true },
    });

    if (!comment) {
      return {
        items: [],
        hasMore: false,
        total: 0,
        success: false,
        errors: [
          { field: "rootCommentId", message: "That comment does not exist." },
        ],
      };
    }

    const allComments = await Comment.find({
      where: { auditstat: true, postId: comment.postId },
    });

    const commentsRootedAtId = PostResolver.getCommentsAtRoot([],allComments,comment, depth);

    return{
      items: commentsRootedAtId.slice(0,realLimit),
      hasMore: commentsRootedAtId.length >= realLimitPlusOne,
      total: commentsRootedAtId.length,
      success: true
    }    
  }

  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async commentOnPost(
    @Arg("postId") postId: number,
    @Arg("input") input: CommentInput,
    @Ctx() { req }: MyContext
  ): Promise<PostResponse> {
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User not authenticated." }],
      };
    }

    const post = await Post.findOne({ where: { id: postId, auditstat: true } });

    if (!post) {
      return {
        success: false,
        errors: [{ field: "Post", message: "Post does not exist." }],
      };
    }

    if (!input.parentId) {
      const comm = await Comment.create({
        text: input.text,
        authorId: req.session.userId,
        postId: postId,
        level: 0,
        rootId: 0,
      }).save();
      comm.rootId = comm.id;
      comm.save();
      const ep = (await PaginatedPosts.convertPostsToEPosts([post]))[0];
      return {
        success: true,
        epost: ep,
      };
    }

    const comment = await Comment.findOne({
      where: { id: input.parentId, auditstat: true },
    });

    if (!comment) {
      return {
        success: false,
        errors: [{ field: "Comment", message: "That comment does not exist." }],
      };
    }

    await Comment.create({
      text: input.text,
      authorId: req.session.userId,
      postId: postId,
      level: comment.level + 1,
      rootId: comment.rootId,
      parentId: input.parentId,
    }).save();

    const ep = (await PaginatedPosts.convertPostsToEPosts([post]))[0];
    return {
      success: true,
      epost: ep,
    };
  }

  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async updateCommentOnPost(
    @Arg("commentId") commentId: number,
    @Arg("input") input: CommentInput,
    @Ctx() { req }: MyContext
  ): Promise<PostResponse> {
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User not authenticated." }],
      };
    }

    const comment = await Comment.findOne({
      where: { id: commentId, auditstat: true },
    });

    if (!comment) {
      return {
        success: false,
        errors: [{ field: "Comment", message: "That comment does not exist." }],
      };
    }

    if (comment.authorId !== req.session.userId) {
      return {
        success: false,
        errors: [
          {
            field: "User",
            message: "You are not authorised to update this comment.",
          },
        ],
      };
    }

    const post = await Post.findOne({
      where: { id: comment.postId, auditstat: true },
    });

    if (!post) {
      comment.auditstat = false;
      await comment.save();
      return {
        success: false,
        errors: [{ field: "Post", message: "Post does not exist." }],
      };
    }

    comment.text = input.text;

    await comment.save();

    const ep = (await PaginatedPosts.convertPostsToEPosts([post]))[0];
    return {
      success: true,
      epost: ep,
    };
  }

  @Mutation(() => PostResponse)
  @UseMiddleware(isAuth)
  async deleteCommentOnPost(
    @Arg("commentId") commentId: number,
    @Ctx() { req }: MyContext
  ): Promise<PostResponse> {
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User not authenticated." }],
      };
    }

    const comment = await Comment.findOne({
      where: { id: commentId, auditstat: true },
    });

    if (!comment) {
      return {
        success: false,
        errors: [{ field: "Comment", message: "That comment does not exist." }],
      };
    }

    if (comment.authorId !== req.session.userId) {
      return {
        success: false,
        errors: [
          {
            field: "User",
            message: "You are not authorised to delete this comment.",
          },
        ],
      };
    }

    const post = await Post.findOne({
      where: { id: comment.postId, auditstat: true },
    });

    if (!post) {
      comment.auditstat = false;
      await comment.save();
      return {
        success: false,
        errors: [{ field: "Post", message: "Post does not exist." }],
      };
    }

    const commentArr = await Comment.find({
      where: { postId: post.id, auditstat: true },
    });

    const commentIdArr = PostResolver.getCommentIdsAtRoot(
      [],
      commentArr,
      commentId
    );

    await getConnection().transaction(async (tm) => {
      await tm
        .createQueryBuilder()
        .update(Comment)
        .set({ auditstat: false })
        .where(`id in (:...coids)`, { coids: commentIdArr })
        .execute();
    });

    const ep = (await PaginatedPosts.convertPostsToEPosts([post]))[0];
    return {
      success: true,
      epost: ep,
    };
  }

  // Recursive method to get list of comments rooted at rootId including rootId
  public static getCommentIdsAtRoot(
    commentIdArr: number[],
    commentArr: Comment[],
    rootId: number,
    depth?: number
  ): number[] {
    // Add rootId to commentIdArr
    commentIdArr.push(rootId);

    if (!depth) {
      // check for comments which have parent = rootId
      const filteredComments = commentArr.filter((co) =>
        !co.parentId ? false : co.parentId === rootId
      );

      // If comment does not have any children, we are done.
      if (filteredComments.length === 0) {
        return commentIdArr;
      }

      // Ids of children
      const newRoots = filteredComments.map((fc) => fc.id);

      // Get Ids which are in the comment tree of these
      newRoots.forEach((n) =>
        PostResolver.getCommentIdsAtRoot(commentIdArr, commentArr, n)
      );

      // commentIdArr has been mutated and ids have been added, can return.
      return commentIdArr;
    }

    // if depth === 0, we have reached the bottom, we are done
    if (depth === 0) {
      return commentIdArr;
    }

    // check for comments which have parent = rootId
    const filteredComments = commentArr.filter((co) =>
      !co.parentId ? false : co.parentId === rootId
    );

    // If comment does not have any children, we are done.
    if (filteredComments.length === 0) {
      return commentIdArr;
    }

    // Ids of children
    const newRoots = filteredComments.map((fc) => fc.id);

    // Get Ids which are in the comment tree of these
    newRoots.forEach((n) =>
      PostResolver.getCommentIdsAtRoot(commentIdArr, commentArr, n, depth-1)
    );

    // if depth === 0, we have reached the bottom, we are done
    return commentIdArr;
  }

  public static getCommentsAtRoot(
    commentIdArr: Comment[],
    commentArr: Comment[],
    rootComment: Comment,
    depth?: number
  ): Comment[] {
    // Add rootId to commentIdArr
    commentIdArr.push(rootComment);

    if (!depth) {
      // check for comments which have parent = rootId
      const filteredComments = commentArr.filter((co) =>
        !co.parentId ? false : co.parentId === rootComment.id
      );

      // If comment does not have any children, we are done.
      if (filteredComments.length === 0) {
        return commentIdArr;
      }

      // Ids of children
      const newRoots = filteredComments.map((fc) => fc);

      // Get Ids which are in the comment tree of these
      newRoots.forEach((n) =>
        PostResolver.getCommentsAtRoot(commentIdArr, commentArr, n)
      );

      // commentIdArr has been mutated and ids have been added, can return.
      return commentIdArr;
    }

    // if depth === 0, we have reached the bottom, we are done
    if (depth === 0) {
      return commentIdArr;
    }

    // check for comments which have parent = rootId
    const filteredComments = commentArr.filter((co) =>
      !co.parentId ? false : co.parentId === rootComment.id
    );

    // If comment does not have any children, we are done.
    if (filteredComments.length === 0) {
      return commentIdArr;
    }

    // Ids of children
    const newRoots = filteredComments.map((fc) => fc);

    // Get Ids which are in the comment tree of these
    newRoots.forEach((n) =>
      PostResolver.getCommentsAtRoot(commentIdArr, commentArr, n, depth-1)
    );

    // if depth === 0, we have reached the bottom, we are done
    return commentIdArr;
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

  await getConnection().transaction(async (tm) => {
    tm.query(
      `
    UPDATE comment as com
    SET auditstat = false
    from (select unnest(string_to_array($1,',')::int[]) as postId ) AS pid
    WHERE com."postId" = pid.postId
    `,
      [postIds.reduce((a, b) => a + b + `,`, ``).slice(0, -1)]
    );
  });

  return;
}
