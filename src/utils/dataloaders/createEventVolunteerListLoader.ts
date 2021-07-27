import { AdminApproval, Eventvolunteer } from "../../entities/Eventvolunteer";
import DataLoader from "dataloader";
import { createQueryBuilder } from "typeorm";
import { Taskvolunteer } from "../../entities/Taskvolunteer";
import { Task } from "../../entities/Task";

export const createEventVolunteerListLoader = (
  adminapproval?: AdminApproval[]
) =>
  new DataLoader<number, Eventvolunteer[] | null>(async (keys) => {
    // getting list of eventIds first
    const sqlquerystring = keys
      .map<string>((k) => `(ev."eventId" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);
    // console.log(sqlquerystring);
    const evolun = await createQueryBuilder()
      .select(`ev.*`)
      .from(Eventvolunteer, `ev`)
      .where(`(` + sqlquerystring + `)`)
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

export const createUserVolunteeredEventsListLoader = () =>
  new DataLoader<number, number[] | undefined>(async (userIds) => {
    const sqlquerystring = userIds
      .map<string>((k) => `(ev."userId" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);

    const evolun = await createQueryBuilder()
      .select(`ev.*`)
      .from(Eventvolunteer, `ev`)
      .where(sqlquerystring)
      .andWhere(`ev.auditstat = true`)
      .andWhere(`ev.adminapproval = '${AdminApproval.APPROVED}'`)
      .getRawMany<Eventvolunteer>();

    const evIdsToEv: Record<number, number[] | undefined> = {};
    userIds.forEach((k) => {
      // grouping by event id by filtering
      const f = evolun.filter((ev) => ev.userId === k).map(ev => ev.eventId);
      if (f.length === 0) {
        evIdsToEv[k] = undefined;
      } else {
        evIdsToEv[k] = f;
      }
    });

    // returns grouped array
    return userIds.map((key) => evIdsToEv[key]);
  });

export const createEventUnassignedVolunteerListLoader = () => 
  new DataLoader<number, number[] | undefined>( async keys => {
    const sqlquerystring = keys
      .map<string>((k) => `(ev."eventId" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);
    // console.log(sqlquerystring);
    const evolun = await createQueryBuilder()
      .select(`ev.*`)
      .from(Eventvolunteer, `ev`)
      .where(`(` + sqlquerystring + `)`)
      .andWhere(`ev.auditstat = true`)
      .andWhere(`adminapproval = 'approved'`)
      .getRawMany<Eventvolunteer>();
    
    const currentTaskVolunteers = await createQueryBuilder()
      .select(`distinct t."eventId" as eid, tv."userId" as uid`)
      .from(Task, `t`)
      .innerJoin(Taskvolunteer, `tv`, `t.id = tv."taskId"`)
      .where(`t."eventId" in (:...eids)`, {eids: keys})
      .andWhere(`t.auditstat = true`)
      .andWhere(`tv.auditstat = true`)
      .getRawMany<{eid: number, uid: number}>();

    const eventIdToUnassignedUid: Record<number, number[] | undefined> = {};

    keys.forEach(k => {
      const filteredEvo = evolun.filter(ev => ev.eventId === k);
      if (filteredEvo.length === 0) {
        eventIdToUnassignedUid[k] = undefined;
      } else {
        const filteredTv = currentTaskVolunteers.filter(t => t.eid === k);
        const ffEvo = filteredEvo.filter(ev => {
          const check = filteredTv.reduce((a,b) => a && (b.uid !== ev.userId), true)
          return check;
        }).map(ev => ev.userId);
        eventIdToUnassignedUid[k] = ffEvo.length === 0 ? undefined : ffEvo
      }
    })

    return keys.map(k => eventIdToUnassignedUid[k]);
  })
