import DataLoader from "dataloader";
import { createQueryBuilder } from "typeorm";
import { Post } from "../../entities/Post";
import { EPost, PaginatedPosts } from "../cardContainers/PostInput";

export const createUserPostsLoader = () =>
  new DataLoader<number, EPost[] | null>(async (userIds) => {
    const posts = await createQueryBuilder()
      .select(`p.*`)
      .from(Post, `p`)
      .where(`p."creatorId" in (:...uid)`, { uid: userIds })
      .andWhere(`p.auditstat = true`)
      .getRawMany<Post>();

    const uidToPosts: Record<number, Post[]> = {};

    userIds.forEach((k) => {
      uidToPosts[k] = posts.filter((p) => p.creatorId === k);
    });

    const uidToEposts: Record<number, EPost[]> = {};

    // for (const k of userIds) {
    //   uidToEposts[k] = await PaginatedPosts.convertPostsToEPosts(uidToPosts[k]);
    // } // synchronuous call

    await Promise.all(userIds.map(async (k) => {
      const content = await PaginatedPosts.convertPostsToEPosts(uidToPosts[k]);
      uidToEposts[k] = content;
    })) // asynchronuous call

    return userIds.map((k) => uidToEposts[k]);
  });
