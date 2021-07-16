import DataLoader from "dataloader";
import { getConnection } from "typeorm";
import { User } from "../../entities/User";
import { Userprofile } from "../../entities/Userprofile";

// [1, 78, 8, 9]
// [{id: 1, username: 'tim'}, {}, {}, {}]
export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);
    const userIdToUser: Record<number, User> = {};
    users.forEach((u) => {
      userIdToUser[u.id] = u;
    });

    const sortedUsers = userIds.map((userId) => userIdToUser[userId]);
    // console.log("userIds", userIds);
    // console.log("map", userIdToUser);
    // console.log("sortedUsers", sortedUsers);
    return sortedUsers;
  });

export const createUserProfileLoader = () =>
  new DataLoader<number, Userprofile | null>(async (userIds) => {
    const users = await getConnection()
      .createQueryBuilder()
      .select(`up.*`)
      .from(Userprofile, `up`)
      .where(`up."userId" in (:...uids)`, { uids: userIds })
      .getRawMany<Userprofile>();

    const userIdToUserprofile: Record<number, Userprofile | null> = {};
    userIds.forEach(uid => {
      const fil = users.filter(u => u.userId === uid);
      if (fil.length === 0) {
        userIdToUserprofile[uid] = null;
      } else {
        userIdToUserprofile[uid] = fil[0];
      }
    })

    const sortedUsers = userIds.map((userId) => userIdToUserprofile[userId]);
    // console.log("userIds", userIds);
    // console.log("map", userIdToUser);
    // console.log("sortedUsers", sortedUsers);
    return sortedUsers;
  });
