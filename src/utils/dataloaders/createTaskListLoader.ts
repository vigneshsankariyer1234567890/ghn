import { Task } from "../../entities/Task";
import DataLoader from "dataloader";
import { createQueryBuilder } from "typeorm";

export const createTaskListLoader = () =>
  new DataLoader<number, Task[] | null>(async (keys) => {
    // getting list of eventIds first
    const tasks = await createQueryBuilder()
      .select(`t.*`)
      .from(Task, `t`)
      .where(`t."eventId" in (:...eid)`, { eid: keys })
      .andWhere(`t.auditstat = true`)
      .getRawMany<Task>();

    const eidToTask: Record<number, Task[]> = {};

    keys.forEach((k) => {
      // grouping by event id by filtering
      eidToTask[k] = tasks.filter((ev) => ev.eventId === k);
    });

    return keys.map((key) => eidToTask[key]);
  });
