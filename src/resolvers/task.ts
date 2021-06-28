import {
  Arg,
  Ctx,
  FieldResolver,
  Int,
  Mutation,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Event } from "../entities/Event";
import { Eventvolunteer } from "../entities/Eventvolunteer";
import { Task, TaskCompletionStatus } from "../entities/Task";
import { Taskvolunteer } from "../entities/Taskvolunteer";
import { User } from "../entities/User";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { TaskResponse, TaskInput } from "../utils/cardContainers/TaskInput";

@Resolver(Task)
export class TaskResolver {
  @FieldResolver(() => [User], { nullable: true })
  async volunteersAssigned(
    @Root() task: Task,
    @Ctx() { req }: MyContext
  ): Promise<User[] | null> {
    if (!req.session.userId) {
      return null;
    }

    const ev = await Eventvolunteer.findOne({
      where: {
        eventId: task.eventId,
        userId: req.session.userId,
        auditstat: true,
      },
    });

    if (!ev) {
      return null;
    }

    return getConnection()
      .createQueryBuilder()
      .select(`u.*`)
      .from(User, `u`)
      .innerJoin(Taskvolunteer, `tv`, `u.id = tv."userId"`)
      .where(`tv.auditstat = true`)
      .getRawMany<User>();
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
