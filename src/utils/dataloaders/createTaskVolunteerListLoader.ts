import { Taskvolunteer } from "../../entities/Taskvolunteer";
import DataLoader from "dataloader";
import { createQueryBuilder } from "typeorm";

export const createTaskVolunteerListLoader = () =>
  new DataLoader<number, Taskvolunteer[] | null>(async (keys) => {
    // getting list of taskIds first
    const sqlquerystring = keys
      .map<string>((k) => `(tv."taskId" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);
    console.log(sqlquerystring);
    const tvolun = await createQueryBuilder()
      .select()
      .from(Taskvolunteer, `tv`)
      .where(sqlquerystring)
      .andWhere(`tv.auditstat = true`)
      .getRawMany<Taskvolunteer>();

    // hashmap for recording mapping between eventid and list of event volunteers
    const tvIdsToTv: Record<number, Taskvolunteer[]> = {};
    keys.forEach((k) => {
      // grouping by event id by filtering
      tvIdsToTv[k] = tvolun.filter((tv) => tv.taskId === k);
    });

    // returns grouped array
    return keys.map((key) => tvIdsToTv[key]);
  });
