import DataLoader from "dataloader";
import { getConnection } from "typeorm";
import { Charityrolelink } from "../../entities/Charityrolelink";

export const createCharityAdminRolesLoader = () =>
  new DataLoader<number, Charityrolelink[] | null>(async (keys) => {
    const sqlquerystring = keys
      .map<string>((k) => `(crl."userId" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);

    const followers = await getConnection()
      .createQueryBuilder()
      .select(`crl.*`)
      .from(Charityrolelink, `crl`)
      .where(`(` + sqlquerystring + `)`)
      .andWhere(`crl.auditstat = true`)
      .getRawMany<Charityrolelink>();

    // hashmap for recording mapping between eventid and list of event volunteers
    const followIdsToFollow: Record<number, Charityrolelink[]> = {};
    keys.forEach((k) => {
      const f = followers.filter((cf) => cf.userId === k);
      followIdsToFollow[k] = f;
    });

    // returns grouped array
    return keys.map((key) => followIdsToFollow[key]);
  });