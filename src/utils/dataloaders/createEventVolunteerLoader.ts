import { Eventvolunteer } from "../../entities/Eventvolunteer";
import DataLoader from "dataloader";
import { createQueryBuilder } from "typeorm";

// [{postId: 5, userId: 10}]
// [{postId: 5, userId: 10, value: 1}]

export const createEventVolunteerLoader = () =>
  new DataLoader<{ eventId: number; userId: number }, Eventvolunteer | null>(
    async (keys) => {
      const sqlquerystring = keys
        .map<string>(
          (k) => `(ev."eventId"=${k.eventId} and ev."userId"=${k.userId})`
        )
        .reduce<string>((a, b) => a + ` or ` + b, ``)
        .slice(3)
      console.log(sqlquerystring);
      const evolun = await createQueryBuilder()
        .select(`ev.*`)
        .from(Eventvolunteer, `ev`)
        .where(sqlquerystring)
        .andWhere(`ev.auditstat=true`)
        .getRawMany<Eventvolunteer>();
      const evIdsToEv: Record<string, Eventvolunteer> = {};
      evolun.forEach((ev) => {
        evIdsToEv[`${ev.userId}|${ev.eventId}`] = ev;
      });

      return keys.map((key) => evIdsToEv[`${key.userId}|${key.eventId}`]);
    }
  );
