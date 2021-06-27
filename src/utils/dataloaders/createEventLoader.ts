import DataLoader from "dataloader";
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

    const sortedEvents = eventIds.map((eventId) => eventIdToEvent[eventId]);
    // console.log("userIds", userIds);
    // console.log("map", userIdToUser);
    // console.log("sortedUsers", sortedUsers);
    return sortedEvents;
  });