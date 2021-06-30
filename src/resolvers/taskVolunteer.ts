import { Arg, Ctx, Int, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { Event } from "../entities/Event";
import { Eventvolunteer } from "../entities/Eventvolunteer";
import { Task } from "../entities/Task";
import { Taskvolunteer } from "../entities/Taskvolunteer";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { TaskVolunteerResponse } from "../utils/cardContainers/TaskVolunteerResponse";

@Resolver()
export class TaskVolunteerResolver {
  @Mutation(() => TaskVolunteerResponse)
  @UseMiddleware(isAuth)
  async addVolunteerToTask(
    @Arg("taskId", () => Int) taskId: number,
    @Arg("userId", () => Int) userId: number,
    @Ctx() { req }: MyContext
  ): Promise<TaskVolunteerResponse> {
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

    const evcheck = await Eventvolunteer.findOne({
      where: {
        userId: userId,
        eventId: ev.id,
        auditstat: true,
        volunteeringCompleted: false,
      },
    });

    if (!evcheck) {
      return {
        errors: [
          {
            field: "Volunteer",
            message: "That user is not part of your event volunteer list.",
          },
        ],
        success: false,
      };
    }

    const tvcheck = await Taskvolunteer.findOne({
      where: { taskId: taskId, userId: userId, auditstat: true },
    });

    if (tvcheck) {
      return {
        errors: [
          {
            field: "Volunteer",
            message: "That user has already been assigned to the task.",
          },
        ],
        success: false,
      };
    }

    await Taskvolunteer.create({ taskId: taskId, userId: userId }).save();

    return { success: true };
  }

  @Mutation(() => TaskVolunteerResponse)
  @UseMiddleware(isAuth)
  async removeVolunteerFromTask(
    @Arg("taskId", () => Int) taskId: number,
    @Arg("userId", () => Int) userId: number,
    @Ctx() { req }: MyContext
  ): Promise<TaskVolunteerResponse> {
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

    const tvcheck = await Taskvolunteer.findOne({
      where: { taskId: taskId, userId: userId, auditstat: true },
    });

    if (!tvcheck) {
      return {
        errors: [
          {
            field: "Volunteer",
            message: "That user has either already been removed or does not exist in your task list.",
          },
        ],
        success: false,
      };
    }

    tvcheck.auditstat = false;
    await tvcheck.save()

    return { success: true };
  }
}
