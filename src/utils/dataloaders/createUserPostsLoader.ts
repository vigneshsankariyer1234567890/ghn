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

    userIds.forEach(async (k) => {
      uidToEposts[k] = await PaginatedPosts.convertPostsToEPosts(uidToPosts[k]);
    });

    return userIds.map((k) => uidToEposts[k]);
  });
