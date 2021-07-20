import {
  Arg,
  Mutation,
  Resolver,
  UseMiddleware,
  Int,
  Ctx,
  Query,
  ObjectType,
  Field,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Event } from "../entities/Event";
import { AdminApproval, Eventvolunteer } from "../entities/Eventvolunteer";
import { User } from "../entities/User";
import { Userprofile } from "../entities/Userprofile";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { EventVolunteerContainer, PaginatedEventVolunteers } from "../utils/cardContainers/PaginatedEventVolunteers";
import { EventResponse } from "./event";
import { FieldError } from "./user";

@ObjectType()
class UpdateEventVolunteerResponse {
  @Field(() => Boolean)
  success!: boolean;

  @Field(() => [FieldError], {nullable: true})
  errors?: FieldError[];
}

@Resolver()
export class EventvolunteerResolver {
  @Mutation(() => EventResponse)
  @UseMiddleware(isAuth)
  async requestEvent(
    @Arg("eventId", () => Int) eventId: number,
    @Ctx() { req }: MyContext
  ): Promise<EventResponse> {
    if (!req.session.userId) {
      return {
        errors: [{ field: "User", message: "You are not signed in." }],
        success: false,
      };
    }

    const up = await Userprofile.findOne({where: { userId: req.session.userId }});

    if (!up) {
      return {
        errors: [{ field: "User", message: 
          `Your user details have not been updated. 
          Please update your details before proceeding.` }],
        success: false,
      }
    }

    if (!up.telegramHandle) {
      return {
        errors: [{ field: "User", message: 
          `Your Telegram handle needs to be updated. 
          Please update your Telegram handle before proceeding.` }],
        success: false,
      }
    }

    const ev = await Event.findOne({ where: { id: eventId, auditstat: true } });

    if (!ev) {
      return {
        errors: [{ field: "Event", message: "That event does not exist." }],
        success: false,
      };
    }

    if (ev.completed) {
      return {
        errors: [{ field: "Event", message: "That event has been completed." }],
        event: ev,
        success: false,
      };
    }

    const eventvolunteer = await getConnection()
      .createQueryBuilder()
      .select("*")
      .from(Eventvolunteer, `ev`)
      .where(`ev."eventId" = :evid`, { evid: eventId })
      .andWhere(`ev."userId" = :usid`, { usid: req.session.userId })
      .andWhere(`ev.auditstat = true`)
      .getRawMany<Eventvolunteer>();

    if (eventvolunteer.length > 0) {
      if (eventvolunteer.length === 1) {
        let evo: Eventvolunteer = eventvolunteer[0];
        return {
          errors: [
            {
              field: "Approval status",
              message: `You have already requested to become a volunteer. Your approval status is ${evo.adminapproval}.`,
            },
          ],
          event: ev,
          success: false,
        };
      }
      return {
        errors: [
          {
            field: "DB error",
            message: "Please contact the developers.",
          },
        ],
        event: ev,
        success: false,
      };
    }

    await getConnection().transaction(async (tm) => {
      await tm
        .createQueryBuilder()
        .insert()
        .into(Eventvolunteer)
        .values({
          eventId: eventId,
          userId: req.session.userId,
          adminapproval: AdminApproval.PENDING,
          userroleId: 2,
          volunteeringCompleted: false
        })
        .execute();
    });

    return { event: ev, success: true };
  }

  @UseMiddleware(isAuth)
  @Query(() => PaginatedEventVolunteers)
  async getVolunteerRequestListForEvents(
    @Arg("eventIds", () => [Int]) eventIds: number[],
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null, // on updatedDate
    @Ctx() { req }: MyContext
  ): Promise<PaginatedEventVolunteers> {
    // this view should be used for charity admins only
    if (!req.session.userId) {
      return {
        success: false,
        hasMore: false,
        errors: [{ field: "User", message: "User is not authenticated." }],
        items: [],
        total: 0
      };
    }

    const charityAdminIds = req.session.charityAdminIds

    if (!charityAdminIds) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
        hasMore: false,
        items: [],
        total: 0
      };
    }

    const ev = (await Event.findByIds(eventIds)).filter(e => e.auditstat === true);

    if (ev.length === 0) {
      return {
        success: false,
        hasMore: false,
        errors: [{ field: "Event", message: "That event does not exist." }],
        items: [],
        total: 0
      };
    }

    const adids = ev.reduce(
      (a,b) => a && charityAdminIds.reduce(
        (c,d) => c || b.charityId === d, false
      )
    , true);

    if (!adids) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
        hasMore: false,
        items: [],
        total: 0
      };
    }

    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = realLimit + 1;

    let date: Date;

    if (cursor) {
      date = new Date(parseInt(cursor));
    } else {
      date = new Date(Date.now());
      date = new Date(date.setHours(date.getHours() + 8));
    }

    const eventvolunteers = await getConnection()
      .createQueryBuilder(Eventvolunteer, `ev`)
      .select(`ev."userId", ev.adminapproval, ev."eventId", ev."updatedAt"`,)
      .distinct()
      .where(`ev.auditstat = true`)
      .andWhere(`ev."eventId" in (:...eid)`, { eid: eventIds})
      .andWhere(`ev."updatedAt" < :cursor::timestamp`, { cursor: date })
      .andWhere(`(ev.adminapproval = 'approved' or ev.adminapproval = 'pending')`)
      .andWhere(`ev."volunteeringCompleted" = false`)
      .addOrderBy(`ev.adminapproval`, `DESC`)
      .limit(realLimitPlusOne)
      .getRawMany<{userId: number, adminapproval: AdminApproval, eventId: number, updatedAt: Date}>();

    const users = await User.findByIds(eventvolunteers.slice(0, realLimit).map(ev => ev.userId))

    const conts = eventvolunteers.map(ev => {
      const fil = users.filter(u => u.id === ev.userId);
      if (fil.length === 1) {
        return new EventVolunteerContainer(fil[0], ev.adminapproval, ev.eventId, ev.updatedAt);
      }
      return new EventVolunteerContainer(undefined, undefined, undefined, undefined);
    })

    return {
      success: true,
      hasMore: eventvolunteers.length === realLimitPlusOne,
      items: conts,
      total: eventvolunteers.length
    };
  }

  @UseMiddleware(isAuth)
  @Mutation(() => UpdateEventVolunteerResponse)
  async acceptEventVolunteer(
    @Arg("eventId", () => Int) eventId: number,
    @Arg("eventVolunteerUserId", () => Int) eventVolunteerUserId: number,
    @Arg("acceptVolunteer", () => Boolean) acceptVolunteer: boolean,
    @Ctx() { req }: MyContext
  ): Promise<UpdateEventVolunteerResponse> {
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
        errors: [{ field: "Event", message: "That event does not exist." }],
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

    const checkVolunteer = await Eventvolunteer.findOne({
      where: {
        eventId: eventId,
        userId: eventVolunteerUserId,
        adminapproval: "pending",
        auditstat: true,
        volunteeringCompleted: false,
      },
    });

    if (!checkVolunteer) {
      return {
        success: false,
        errors: [
          {
            field: "Event Volunteer",
            message: "There is no such volunteer request.",
          },
        ],
      };
    }

    checkVolunteer.adminapproval = acceptVolunteer
      ? AdminApproval.APPROVED
      : AdminApproval.REJECTED;

    checkVolunteer.save();

    return { success: true };
  }
}
