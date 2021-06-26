import DataLoader from "dataloader";
import { Charity } from "../../entities/Charity";

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