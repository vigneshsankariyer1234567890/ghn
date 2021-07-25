import DataLoader from "dataloader";
import { createQueryBuilder } from "typeorm";
import { Comment } from "../../entities/Comment";
// import { CommentTree } from "../commentsAndThreads/CommentTree";
// import { Thread } from "../commentsAndThreads/Thread";

export const createPostCommentsLoader = () =>
  new DataLoader<number, Comment[] | undefined>(async (postIds) => {
    const allComments = await createQueryBuilder()
      .select(`co.*`)
      .from(Comment, `co`)
      .where(`co."postId" in (:...pids)`, { pids: postIds })
      .andWhere(`co.auditstat = true`)
      .getRawMany<Comment>();

    const pidToThread: Record<number, Comment[] | undefined> = {};

    postIds.forEach((pid) => {
      const filteredComments = allComments.filter((c) => c.postId === pid);
      if (filteredComments.length === 0) {
        pidToThread[pid] = undefined;
      } else {
        // const baseTrees = filteredComments
        //   .filter((c) => (c.parentId ? false : true))
        //   .map((co) => new CommentTree(co));
        pidToThread[pid] = filteredComments
        // new Thread(
        //   pid,
        //   baseTrees.map((bt) =>
        //     CommentTree.buildCommentTree(filteredComments, bt)
        //   )
        // );
      }
    });

    return postIds.map((pid) => pidToThread[pid]);
  });
