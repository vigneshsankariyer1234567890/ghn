import { getConnection } from "typeorm";
import { Charityfollow } from "../../entities/Charityfollow";

const convertCharIdsToUserIds = async (charIds: number[]): Promise<Record<number, number[]>> => {

  const charIdToFollowerIds: Record<number, number[]> = {};

  const follows =  getConnection()
    .createQueryBuilder()
    .select(`cf.*`)
    .from(Charityfollow, `cf`)
    .where(`cf."charityId" in (:charids)`, {charids: charIds as number[]})
    .andWhere(`cf.auditstat = true`)
    .orderBy(`cf."charityId"`, "ASC")
    .getRawMany<Charityfollow>();
  
  charIds.forEach(num => {
    follows.then(
      i => {
        const nums = i.filter( f => f.charityId === num).map(f => f.userId);
        charIdToFollowerIds[num] = nums;
      }
    )
  });

  return charIdToFollowerIds;

} 

export default convertCharIdsToUserIds