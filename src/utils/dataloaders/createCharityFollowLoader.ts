import DataLoader from "dataloader";
import { getConnection } from "typeorm";
import { Charityfollow } from "../../entities/Charityfollow";

export const createSingleCharityFollowLoader = () =>
  new DataLoader<{ charityId: number; userId: number }, Charityfollow | null>(
    async (keys) => {
      const sqlquerystring = keys
        .map<string>(
          (k) =>
            `(cf."charityId" = ${k.charityId} and cf."userId" = ${k.userId} and cf.auditstat = true)`
        )
        .reduce<string>((a, b) => a + ` or ` + b, ``)
        .slice(3);

      const follows = await getConnection()
        .createQueryBuilder()
        .select(`cf.*`)
        .from(Charityfollow, `cf`)
        .where(`(` + sqlquerystring + `)`)
        .getRawMany<Charityfollow>();

      const followIdsToFollow: Record<string, Charityfollow> = {};

      follows.forEach((follow) => {
        followIdsToFollow[`${follow.charityId}|${follow.userId}`] = follow;
      });

      return keys.map(
        (key) => followIdsToFollow[`${key.charityId}|${key.userId}`]
      );
    }
  );

export const createCharityFollowersLoader = () =>
  new DataLoader<number, Charityfollow[] | null>(async (keys) => {
    const sqlquerystring = keys
      .map<string>((k) => `(cf."charityId" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);

    const followers = await getConnection()
      .createQueryBuilder()
      .select(`cf.*`)
      .from(Charityfollow, `cf`)
      .where(`(` + sqlquerystring + `)`)
      .andWhere(`cf.auditstat = true`)
      .getRawMany<Charityfollow>();

    // hashmap for recording mapping between eventid and list of event volunteers
    const followIdsToFollow: Record<number, Charityfollow[]> = {};
    keys.forEach((k) => {
      const f = followers.filter((cf) => cf.charityId === k);
      followIdsToFollow[k] = f;
    });

    // returns grouped array
    return keys.map((key) => followIdsToFollow[key]);
  });

  export const createUserCharityFollowsLoader = () =>
  new DataLoader<number, Charityfollow[] | null>(async (keys) => {
    const sqlquerystring = keys
      .map<string>((k) => `(cf."userId" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);

    const followers = await getConnection()
      .createQueryBuilder()
      .select(`cf.*`)
      .from(Charityfollow, `cf`)
      .where(`(` + sqlquerystring + `)`)
      .andWhere(`cf.auditstat = true`)
      .getRawMany<Charityfollow>();

    // hashmap for recording mapping between eventid and list of event volunteers
    const followIdsToFollow: Record<number, Charityfollow[]> = {};
    keys.forEach((k) => {
      const f = followers.filter((cf) => cf.userId === k);
      followIdsToFollow[k] = f;
    });

    // returns grouped array
    return keys.map((key) => followIdsToFollow[key]);
  });
