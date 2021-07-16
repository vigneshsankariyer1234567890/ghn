import DataLoader from "dataloader";
import { getConnection } from "typeorm";
import { Charity } from "../../entities/Charity";
import { Charityprofile } from "../../entities/Charityprofile";

// [1, 78, 8, 9]
// [{id: 1, username: 'tim'}, {}, {}, {}]
export const createCharityLoader = () =>
  new DataLoader<number, Charity>(async (charIds) => {
    const chars = await Charity.findByIds(charIds as number[]);
    const charIdToChar: Record<number, Charity> = {};
    chars.forEach((c) => {
      charIdToChar[c.id] = c;
    });

    const sortedChars = charIds.map((charId) => charIdToChar[charId]);
    // console.log("userIds", userIds);
    // console.log("map", userIdToUser);
    // console.log("sortedUsers", sortedUsers);
    return sortedChars;
  });

export const createCharityProfileLoader = () =>
  new DataLoader<number, Charityprofile | null>(async (charIds) => {
    const charities = await getConnection()
      .createQueryBuilder()
      .select(`cp.*`)
      .from(Charityprofile, `cp`)
      .where(`cp."charityId" in (:...cids)`, { cids: charIds })
      .getRawMany<Charityprofile>();

    const charIdToCharprof: Record<number, Charityprofile | null> = {};
    charIds.forEach((cid) => {
      const fil = charities.filter((c) => c.charityId === cid);
      if (fil.length === 0) {
        charIdToCharprof[cid] = null;
      } else {
        charIdToCharprof[cid] = fil[0];
      }
    });

    const sortedChars = charIds.map((charId) => charIdToCharprof[charId]);
    // console.log("userIds", userIds);
    // console.log("map", userIdToUser);
    // console.log("sortedUsers", sortedUsers);
    return sortedChars;
  });
