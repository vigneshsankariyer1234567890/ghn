import DataLoader from "dataloader";
import { getConnection } from "typeorm";
import { Event } from "../../entities/Event";

// [1, 78, 8, 9]
// [{id: 1, username: 'tim'}, {}, {}, {}]
export const createEventLoader = () =>
  new DataLoader<number, Event>(async (eventIds) => {
    const events = await Event.findByIds(eventIds as number[]);
    const eventIdToEvent: Record<number, Event> = {};
    events.forEach((e) => {
      eventIdToEvent[e.id] = e;
    });

    return eventIds.map(e => eventIdToEvent[e]);
  });

export const createCEventsLoader = () =>
  new DataLoader<number, Event[]>(async (charIds) => {
    const sqlquerystring = charIds
      .map<string>((k) => `(ev."charityId" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);
    const events = await getConnection()
      .createQueryBuilder()
      .select(`ev.*`)
      .from(Event, `ev`)
      .where(`(` + sqlquerystring + `)`)
      .andWhere(`ev.auditstat = true`)
      .orderBy(`ev."updatedAt"`, "DESC")
      .getRawMany<Event>();

      const charityIdsToEvents: Record<number, Event[]> = {};

      charIds.forEach((k) => {
        const evs = events.filter((ev) => ev.charityId === k);
        charityIdsToEvents[k] = evs;
      });

      return charIds.map((key) => charityIdsToEvents[key]);
    
  });
