import DataLoader from "dataloader";
import { getConnection } from "typeorm";
import { Userfriend, FriendRequestStatus } from "../../entities/Userfriend";

export const createUserFriendsLoader = () =>
  new DataLoader<number, Userfriend[] | null>(async (userIds) => {
    const sqlquerystring = userIds
      .map<string>((k) => `(uf."user1Id" = ${k} or uf."user2Id" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);

    const friends = await getConnection()
      .createQueryBuilder()
      .select(`uf.*`)
      .from(Userfriend, `uf`)
      .where(sqlquerystring)
      .andWhere(`uf.friendreqstatus = '${FriendRequestStatus.ACCEPTED}'`)
      .getRawMany<Userfriend>();

    const userIdToFriend: Record<number, Userfriend[]> = {};
    userIds.forEach((k) => {
      const friendss = friends.filter(
        (f) => f.user1Id === k || f.user2Id === k
      );
      userIdToFriend[k] = friendss;
    });
    return userIds.map((u) => userIdToFriend[u]);
  });

export const createUserFriendshipLoader = () =>
  new DataLoader<{ user1Id: number; user2Id: number }, Userfriend | null>(
    async (ids) => {
      const sqlquerystring = ids
        .map<string>((k) =>
          k.user1Id > k.user2Id
            ? `(uf."user1Id" = ${k.user2Id} and uf."user2Id" = ${k.user1Id})`
            : `(uf."user1Id" = ${k.user1Id} and uf."user2Id" = ${k.user2Id})`
        )
        .reduce<string>((a, b) => a + ` or ` + b, ``)
        .slice(3);

      const friends = await getConnection()
        .createQueryBuilder()
        .select(`uf.*`)
        .from(Userfriend, `uf`)
        .where(sqlquerystring)
        .andWhere(
          `uf.friendreqstatus <> '${FriendRequestStatus.REJECTED}' 
          AND uf.friendreqstatus <> '${FriendRequestStatus.BLOCKED_USER1}' 
          AND uf.friendreqstatus <> '${FriendRequestStatus.BLOCKED_USER2}'`
        )
        .getRawMany<Userfriend>();

      const friendIdToFriend: Record<string, Userfriend> = {};
      friends.forEach((f) => {
        friendIdToFriend[`${f.user1Id}|${f.user2Id}`] = f;
      });

      return ids.map((i) =>
        i.user1Id > i.user2Id
          ? friendIdToFriend[`${i.user2Id}|${i.user1Id}`]
          : friendIdToFriend[`${i.user1Id}|${i.user2Id}`]
      );
    }
  );
