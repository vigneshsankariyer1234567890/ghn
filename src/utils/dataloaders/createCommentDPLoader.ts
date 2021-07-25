import DataLoader from "dataloader";
import { createQueryBuilder } from "typeorm";
import { Comment } from "../../entities/Comment";
import { User } from "../../entities/User";
import { Userprofile } from "../../entities/Userprofile";

export const createCommentDPLoader = () =>
  new DataLoader<number, string|undefined>( async (commIds) => {
      const comm = await createQueryBuilder()
        .select()
        .from(Comment, `co`)
        .where(`co.id in (:...cids)`, {cids: commIds})
        .getRawMany<Comment>();

      const uids = comm.map(c => c.authorId);

      const userdp = await createQueryBuilder()
        .select(`up."userId", up."displayPicture"`)
        .from(User, `u`)
        .innerJoin(Userprofile, `up`, `u.id = up."userId"`)
        .where(`u.id in (:...uids)`, {uids: uids})
        .getRawMany<{userId: number, displayPicture?: string}>()
    
      const cidToDp: Record<number, string|undefined> = {};

      comm.forEach(co => {
          const filtered = userdp.filter(u => u.userId === co.authorId);
          if (filtered.length === 0) {
              cidToDp[co.id] = undefined;
          } else {
              cidToDp[co.id] = filtered[0].displayPicture;
          }
      })

      return commIds.map(c => cidToDp[c]);
  })