import { AdminApproval, Eventvolunteer } from "../../entities/Eventvolunteer";
import DataLoader from "dataloader";
import { createQueryBuilder } from "typeorm";

export const createEventVolunteerListLoader = (
  adminapproval?: AdminApproval[]
) =>
  new DataLoader<number, Eventvolunteer[] | null>(async (keys) => {
    // getting list of eventIds first
    const sqlquerystring = keys
      .map<string>((k) => `(ev."eventId" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);
    console.log(sqlquerystring);
    const evolun = await createQueryBuilder()
      .select()
      .from(Eventvolunteer, `ev`)
      .where(`(`+sqlquerystring+`)`)
      .andWhere(`ev.auditstat = true`)
      .getRawMany<Eventvolunteer>();

    // hashmap for recording mapping between eventid and list of event volunteers
    const evIdsToEv: Record<number, Eventvolunteer[]> = {};
    keys.forEach((k) => {
      // grouping by event id by filtering
      const f = evolun.filter((ev) => ev.eventId === k);
      if (adminapproval) {
        // if adminapproval parameter provided, filter on list of admin approvals provided
        evIdsToEv[k] = f.filter((ev) =>
          adminapproval.reduce((a, b) => a || ev.adminapproval === b, true)
        );
      } else {
        // else give back everything
        evIdsToEv[k] = f;
      }
    });

    // returns grouped array
    return keys.map((key) => evIdsToEv[key]);
  });
