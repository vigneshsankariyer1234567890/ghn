import { Charityfollow } from "../../entities/Charityfollow";
import DataLoader from "dataloader";

// [{postId: 5, userId: 10}]
// [{postId: 5, userId: 10, value: 1}]



export const createCharityFollowLoader = () =>
  new DataLoader<{ charId: number; userId: number }, Charityfollow | null>(
    async (keys) => {
      const follows =  await Charityfollow.findByIds(keys as any);
      const followIdsToFollow: Record<string, Charityfollow> = {};
      follows.forEach((follow) => {
        followIdsToFollow[`${follow.userId}|${follow.charityId}`] = follow;
      });

      return keys.map(
        (key) => followIdsToFollow[`${key.userId}|${key.charId}`]
      );
    }
  );