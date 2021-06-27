import { Like } from "../../entities/Like";
import DataLoader from "dataloader";

// [{postId: 5, userId: 10}]
// [{postId: 5, userId: 10, value: 1}]



export const createLikesLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Like | null>(
    async (keys) => {
      const likes = await Like.findByIds(keys as any);
      const likeIdsToLike: Record<string, Like> = {};
      likes.forEach((like) => {
        likeIdsToLike[`${like.userId}|${like.postId}`] = like;
      });

      return keys.map(
        (key) => likeIdsToLike[`${key.userId}|${key.postId}`]
      );
    }
  );