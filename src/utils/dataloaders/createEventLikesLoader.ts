import { Eventlike } from "../../entities/Eventlike";
import DataLoader from "dataloader";
import { getConnection } from "typeorm";

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

      return keys.map((key) => likeIdsToLike[`${key.userId}|${key.eventId}`]);
    }
  );

export const createEventLikesArrayLoader = () =>
  new DataLoader<number, Eventlike[] | null>(async (keys) => {
    const sqlquerystring = keys
      .map<string>((k) => `(ev."userId" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);

    const likes = await getConnection()
      .createQueryBuilder()
      .select(`ev.*`)
      .from(Eventlike, `ev`)
      .where(`(` + sqlquerystring + `)`)
      // .andWhere(`ev.auditstat = true`)
      .getRawMany<Eventlike>();
    
    // hashmap for recording mapping between eventid and list of event volunteers
    const likeIdsToLikes: Record<number, Eventlike[]> = {};
    keys.forEach((k) => {
      const f = likes.filter((cf) => cf.userId === k);
      likeIdsToLikes[k] = f;
    });

    // returns grouped array
    return keys.map((key) => likeIdsToLikes[key]);
  });
