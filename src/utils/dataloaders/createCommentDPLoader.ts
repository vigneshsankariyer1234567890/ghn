import DataLoader from "dataloader";
import { createQueryBuilder } from "typeorm";
import { Comment } from "../../entities/Comment";
import { User } from "../../entities/User";
// import { Userprofile } from "../../entities/Userprofile";

export const createCommentDPLoader = () =>
  new DataLoader<number, User|undefined>( async (commIds) => {
      const comm = await createQueryBuilder()
        .select()
        .from(Comment, `co`)
        .where(`co.id in (:...cids)`, {cids: commIds})
        .getRawMany<Comment>();

      const uids = comm.map(c => c.authorId);

      const userdp = await createQueryBuilder()
        .select(`u.*`)
        .from(User, `u`)
        .where(`u.id in (:...uids)`, {uids: uids})
        .getRawMany<User>()
    
      const cidToDp: Record<number, User|undefined> = {};

      comm.forEach(co => {
          const filtered = userdp.filter(u => u.id === co.authorId);
          if (filtered.length === 0) {
              cidToDp[co.id] = undefined;
          } else {
              cidToDp[co.id] = filtered[0];
          }
      })

      return commIds.map(c => cidToDp[c]);
  })