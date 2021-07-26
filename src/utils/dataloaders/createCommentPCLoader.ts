import DataLoader from "dataloader";
import { createQueryBuilder } from "typeorm";
import { Comment } from "../../entities/Comment";

export const createCommentPCLoader = () =>
  new DataLoader<number, Comment | undefined>( async (commIds) => {
      const comm = await createQueryBuilder()
        .select()
        .from(Comment, `co`)
        .where(`co.id in (:...cids)`, {cids: commIds})
        .getRawMany<Comment>();

      const cidun = comm.map(c => c.parentId ? c.parentId : -1);
      const cidfiltered = cidun.filter(c => c > 0);

      const pComms = await createQueryBuilder()
        .select(`c.*`)
        .from(Comment, `c`)
        .where(`c.id in (:...cids)`, {cids: cidfiltered})
        .getRawMany<Comment>()
    
      const cidToParent: Record<number, Comment|undefined> = {};

      comm.forEach(co => {
          if (!co.parentId) {
            cidToParent[co.id] = undefined;
          } else {
              cidToParent[co.id] = pComms.filter(c => c.id === co.parentId)[0];
          }
      })

      return commIds.map(c => cidToParent[c]);
  })