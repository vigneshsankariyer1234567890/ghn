import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Event } from "../entities/Event";
import { AdminApproval } from "../entities/Eventvolunteer";
import { Task, TaskCompletionStatus } from "../entities/Task";
import { Taskvolunteer } from "../entities/Taskvolunteer";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { PaginatedTasks } from "../utils/cardContainers/PaginatedTasks";
import { TaskResponse, TaskInput } from "../utils/cardContainers/TaskInput";
import { createEventVolunteerListLoader } from "../utils/dataloaders/createEventVolunteerListLoader";

@Resolver(Task)
export class TaskResolver {
  private static approvedEventDataLoader = createEventVolunteerListLoader([
    AdminApproval.APPROVED,
  ]);
  
  @FieldResolver(() => [User], { nullable: true })
  async volunteersAssigned(
    @Root() task: Task,
    @Ctx() { req, eventVolunteerLoader, taskVolunteerListLoader, userLoader }: MyContext
  ): Promise<(User|Error)[] | null> {
    if (!req.session.userId) {
      return null;
    }

    const ev = await eventVolunteerLoader.load({eventId: task.eventId, userId: req.session.userId})

    if (!ev) {
      return null;
    }

    const tv = await taskVolunteerListLoader.load(task.id);

    if (!tv) {
      return null;
    }

    return userLoader.loadMany(tv.map(t => t.userId));
  }

  @FieldResolver(() => [User], { nullable: true })
  async unassignedVolunteers(
    @Root() task: Task,
    @Ctx() { req, userLoader, eventLoader, taskVolunteerListLoader }: MyContext
  ): Promise<(User|Error)[] | null> {
    if (!req.session.userId) {
      return null;
    }

    if (!req.session.charityAdminIds) {
      return null;
    }

    const event = await eventLoader.load(task.eventId);

    const valid = req.session.charityAdminIds.reduce((a,b) => a || b === event.charityId, false);

    if (!valid) {
      return null;
    }

    const evlist = await TaskResolver.approvedEventDataLoader.load(event.id);

    if (!evlist) {
      return null;
    }

    const evuids = evlist.map(ev => ev.userId);

    const taskvs = await taskVolunteerListLoader.load(task.id);

    if (!taskvs) {
      return userLoader.loadMany(evuids);
    }

    const taskuids = taskvs.map(tv => tv.userId);

    const filtered = evuids.filter(u => {
      const f = taskuids.filter(v => v === u);
      return f.length === 0;
    })

    return userLoader.loadMany(filtered);
  }

  @FieldResolver(() => Boolean)
  async adminStatus(
    @Root() task: Task,
    @Ctx() { req, eventLoader }: MyContext
  ): Promise<boolean> {
    if (!req.session.userId) {
      return false;
    }

    if (!req.session.charityAdminIds) {
      return false;
    }

    const chid = await (await eventLoader.load(task.eventId)).charityId

    const adids = req.session.charityAdminIds.reduce((a,b) => a || b === chid , false);

    return adids;
  }

  @Query(() => PaginatedTasks)
  async searchTasks(
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null,
    @Arg("input", () => String, { nullable: true }) input: string | null,
    @Ctx() {req} : MyContext
  ): Promise<PaginatedTasks> {
    if (!req.session.userId) {
      return {
        items:[],
        hasMore:false,
        total:0,
        success:false,
        errors: [{field: "User", message: "User not authenticated"}]
      }
    }

    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    const replacements: any[] = [realLimitPlusOne, req.session.userId];

    if (cursor) {
      replacements.push(new Date(parseInt(cursor))); //cursor null at first
    } else {
      replacements.push(new Date(Date.now()));
    }

    const tasks = await getConnection().query(`
    select * from (	
      select distinct t.* from event ev
      inner join task t on ev.id = t."eventId"
      inner join eventvolunteer evr on evr."userId" = $2
      where ev.auditstat = true and t.auditstat = true and evr.auditstat = true 
      and evr.adminapproval = 'approved'
    ) task 
    where task."updatedAt" < $3
    ${input ? `and ev.name ILIKE ` + `'` + input + `%` + `'` : ""}
    order by 
      task."updatedAt" DESC
    limit $1
    `, replacements)

    const tot = await getConnection().query(`
    select COUNT(*) as "count" from ( 
      select * from (	
        select distinct t.* from event ev
        inner join task t on ev.id = t."eventId"
        inner join eventvolunteer evr on evr."userId" = $2
        where ev.auditstat = true and t.auditstat = true and evr.auditstat = true 
        and evr.adminapproval = 'approved'
      ) task 
      where task."updatedAt" < $3
      ${input ? `and ev.name ILIKE ` + `'` + input + `%` + `'` : ""}
      order by 
        task."updatedAt" DESC
      limit $1
    ) c
    `, replacements)

    return {
      items: tasks.slice(0, realLimit),
      hasMore: tasks.length === realLimitPlusOne,
      total: parseInt(tot[0].count),
      success: true,
    };

  }

  @Mutation(() => TaskResponse)
  @UseMiddleware(isAuth)
  async createTask(
    @Arg("eventId", () => Int) eventId: number,
    @Arg("taskInput", () => TaskInput) input: TaskInput,
    @Ctx() { req }: MyContext
  ): Promise<TaskResponse> {
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User is not authenticated." }],
      };
    }

    if (!req.session.charityAdminIds) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    const ev = await Event.findOne({
      where: { id: eventId, auditstat: true, completed: false },
    });

    if (!ev) {
      return {
        success: false,
        errors: [
          {
            field: "Event",
            message: "That event has either been completed or does not exist.",
          },
        ],
      };
    }

    const adids = req.session.charityAdminIds.filter((i) => i === ev.charityId);

    if (adids.length === 0) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    const t = await Task.create({
      ...input,
      eventId: ev.id,
    }).save();

    return { success: true, task: t };
  }

  @Mutation(() => TaskResponse)
  @UseMiddleware(isAuth)
  async updateTask(
    @Arg("taskId", () => Int) taskId: number,
    @Arg("taskInput", () => TaskInput) input: TaskInput,
    @Ctx() { req }: MyContext,
    @Arg("completionStatus", () => TaskCompletionStatus, { nullable: true })
    completionStatus?: TaskCompletionStatus
  ): Promise<TaskResponse> {
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User is not authenticated." }],
      };
    }

    if (!req.session.charityAdminIds) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    const task = await Task.findOne({
      where: { id: taskId, auditstat: true },
    });

    if (!task) {
      return {
        success: false,
        errors: [
          {
            field: "Task",
            message: "That task does not exist.",
          },
        ],
      };
    }

    const ev = await Event.findOne({
      where: { id: task.eventId, auditstat: true, completed: false },
    });

    if (!ev) {
      return {
        success: false,
        errors: [
          {
            field: "DB",
            message: "That event seems to have been completed or deleted.",
          },
        ],
      };
    }

    const adids = req.session.charityAdminIds.filter((i) => i === ev.charityId);

    if (adids.length === 0) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    task.description = input.description;
    task.deadline = input.deadline;
    task.completionstatus = completionStatus
      ? completionStatus
      : task.completionstatus;

    await task.save();

    return { success: true, task: task };
  }

  @Mutation(() => TaskResponse)
  @UseMiddleware(isAuth)
  async deleteTask(
    @Arg("taskId", () => Int) taskId: number,
    @Ctx() { req }: MyContext
  ): Promise<TaskResponse> {
    if (!req.session.userId) {
      return {
        success: false,
        errors: [{ field: "User", message: "User is not authenticated." }],
      };
    }

    if (!req.session.charityAdminIds) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    const task = await Task.findOne({
      where: { id: taskId, auditstat: true },
    });

    if (!task) {
      return {
        success: false,
        errors: [
          {
            field: "Task",
            message: "That task does not exist.",
          },
        ],
      };
    }

    const ev = await Event.findOne({
      where: { id: task.eventId, auditstat: true, completed: false },
    });

    if (!ev) {
      return {
        success: false,
        errors: [
          {
            field: "DB",
            message: "That event seems to have been completed or deleted.",
          },
        ],
      };
    }

    const adids = req.session.charityAdminIds.filter((i) => i === ev.charityId);

    if (adids.length === 0) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    task.auditstat = false;
    task.save();

    await getConnection().transaction(async (tm) => {
      tm.createQueryBuilder()
        .update(Taskvolunteer)
        .set({ auditstat: false })
        .where(`"taskId" = :tid`, { tid: task.id })
        .execute();
    });

    return { success: true };
  }

  
}
