import {
  Arg,
  Mutation,
  Resolver,
  UseMiddleware,
  Int,
  Ctx,
  Query,
} from "type-graphql";
import { getConnection } from "typeorm";
import { Charity } from "../entities/Charity";
import { Event } from "../entities/Event";
import { AdminApproval, Eventvolunteer } from "../entities/Eventvolunteer";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { PaginatedEventVolunteers } from "../utils/cardContainers/PaginatedEventVolunteers";
import { validateCharityAdmin } from "../utils/validateCharityAdmin";
import { EventResponse } from "./event";

@Resolver()
export class EventvolunteerResolver {
  @Mutation(() => EventResponse)
  @UseMiddleware(isAuth)
  async requestEvent(
    @Arg("eventId", () => Int) eventId: number,
    @Ctx() { req }: MyContext
  ): Promise<EventResponse> {
    const ev = await Event.findOne({ where: { id: eventId } });

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
        .into(Eventvolunteer, [
          `"eventId"`,
          `"userId"`,
          `adminapproval`,
          `"userroleId"`,
        ])
        .values({
          eventId: eventId,
          userId: req.session.userId,
          adminapproval: AdminApproval.PENDING,
          userroleId: 2,
        })
        .execute();
    });

    return { event: ev, success: true };
  }

  @Query(() => PaginatedEventVolunteers)
  @UseMiddleware(isAuth)
  async getAllEventRequestList(
    @Arg("eventId", () => Int) eventId: number,
    @Arg("limit", () => Int) limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null, // on updatedDate
    @Ctx() { req }: MyContext
  ): Promise<PaginatedEventVolunteers> {
    if (!req.session.userId) {
      return {
        success: false,
        hasMore: false,
        errors: [{ field: "User", message: "User is not authenticated." }],
      };
    }

    const ev = await Event.findOne({ where: { id: eventId, auditstat: true } });

    if (!ev) {
      return {
        success: false,
        hasMore: false,
        errors: [{ field: "Event", message: "That event does not exist." }],
      };
    }

    const char = await getConnection()
      .createQueryBuilder()
      .select(`ch.*`)
      .from(Charity, `ch`)
      .innerJoin(Event, `e`, `ch.id = e."charityId"`)
      .where(`e.id = :eid`, { eid: eventId })
      .getRawOne<Charity>();

    const check = await validateCharityAdmin({
      userid: req.session.userId,
      charityId: char.id,
    });

    if (!check.success) {
      return {
        success: false,
        hasMore: false,
        errors: check.errors,
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
      .select(`ev.*`)
      .where(`ev.auditstat = true`)
      .andWhere(`ev."updatedAt" < :cursor::timestamp`, { cursor: date })
      .orderBy(`ev."updatedAt"`, `DESC`)
      .limit(realLimitPlusOne)
      .getRawMany<Eventvolunteer>();
    
    return { 
        success: true,
        hasMore: eventvolunteers.length === realLimitPlusOne,
        eventvolunteers: eventvolunteers.slice(0, realLimit)
    };
  }
}
