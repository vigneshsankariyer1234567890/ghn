import { Eventlike } from "../../entities/Eventlike";
import DataLoader from "dataloader";

// [{postId: 5, userId: 10}]
// [{postId: 5, userId: 10, value: 1}]

export const createEventLikesLoader = () =>
  new DataLoader<{ eventId: number; userId: number }, Eventlike | null>(
    async (keys) => {
      const likes = await Eventlike.findByIds(keys as any);
      const likeIdsToLike: Record<string, Eventlike> = {};
      likes.forEach((like) => {
        likeIdsToLike[`${like.userId}|${like.eventId}`] = like;
      });

      return keys.map( 
        (key) => likeIdsToLike[`${key.userId}|${key.eventId}`]
      );
    }
  );