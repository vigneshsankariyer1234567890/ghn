import { Arg, Ctx, Int, Mutation, Resolver, UseMiddleware } from "type-graphql";
import { getConnection } from "typeorm";
import { Event } from "../entities/Event";
import { Eventvolunteer } from "../entities/Eventvolunteer";
import { User } from "../entities/User";
import { Userprofile } from "../entities/Userprofile";
import { Userrole } from "../entities/Userrole";
import { isAuth } from "../middleware/isAuth";
import { MyContext } from "../types";
import { EventResponse } from "./event";
import { createTelegramChannel } from "../utils/telegramUtils/createTelegramChannel";
import { addNewUsersToChannel } from "../utils/telegramUtils/addNewUsersToChannel";

@Resolver()
export class TelegramResolver {
  @Mutation(() => EventResponse)
  @UseMiddleware(isAuth)
  async createTelegramGroupForEvent(
    @Arg("eventId", () => Int) eventId: number,
    @Arg("groupName") groupName: string,
    @Arg("groupDescription") groupDescription: string,
    @Ctx() { req }: MyContext
  ): Promise<EventResponse> {
    if (!req.session.userId) {
      return {
        errors: [
          {
            field: "User",
            message: "User is not authenticated.",
          },
        ],
        success: false,
      };
    }

    const ev = await Event.findOne({ where: { id: eventId, auditstat: true } });

    if (!ev) {
      return {
        errors: [
          {
            field: "Event",
            message: "That event does not exist.",
          },
        ],
        success: false,
      };
    }

    const charityId = ev.charityId;

    if (!req.session.charityAdminIds) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    const adids = req.session.charityAdminIds.reduce(
      (a, b) => a || b === charityId,
      false
    );

    if (!adids) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    if (
      ev.telegramGroupHash ||
      ev.telegramGroupId ||
      ev.telegramGroupUpdatedDate
    ) {
      return {
        errors: [
          {
            field: "Telegram group",
            message: `A telegram group already exists. You may update the members of the group instead.`,
          },
        ],
        success: false,
      };
    }

    const eventVolunteers = await getConnection()
      .createQueryBuilder()
      .select(
        `distinct volun.id as evid, u.id as userid, 
      ur.id as urid, ur."roleName", up."telegramHandle"`
      )
      .from(Event, `ev`)
      .innerJoin(Eventvolunteer, `volun`, `volun."eventId" = ev.id`)
      .innerJoin(Userrole, `ur`, `ur.id = volun."userroleId"`)
      .innerJoin(User, `u`, `u.id = volun."userId"`)
      .innerJoin(Userprofile, `up`, `up."userId" = u.id`)
      .where(`volun.adminapproval = 'approved'`)
      .andWhere(`volun.auditstat = true`)
      .andWhere(`ev.auditstat = true`)
      .andWhere(`ev.id = :eid`, { eid: eventId })
      .andWhere(`up."telegramHandle" is not null`)
      .getRawMany<{
        evid: number;
        userid: number;
        urid: number;
        roleName: string;
        telegramHandle: string;
      }>();

    const charUsers = eventVolunteers
      .filter((ev) => ev.urid === 1)
      .map((ev) => ev.telegramHandle)
      .reduce((a, b) => a + b + `,`, ``)
      .slice(0, -1);

    const nonCharUsers = eventVolunteers
      .filter((ev) => ev.urid === 2)
      .map((ev) => ev.telegramHandle)
      .reduce((a, b) => a + b + `,`, ``)
      .slice(0, -1);

    const res = createTelegramChannel(
      groupName,
      groupDescription,
      charUsers,
      nonCharUsers
    );

    if (!res.success) {
      return {
        success: res.success,
        errors: res.errors,
        timeout: res.timeout,
      };
    }

    if (!res.apiId || !res.apiHash) {
      return {
        success: false,
        errors: [
          {
            field: "Telegram Group",
            message: "Unable to create telegram group.",
          },
        ],
        timeout: res.timeout,
      };
    }

    const channelId = res.apiId;
    const channelHash = res.apiHash;
    const today = new Date(Date.now());

    await getConnection().transaction(async (tm) => {
      tm.query(
        `UPDATE event 
            set "telegramGroupId" = $1
            , "telegramGroupHash" = $2
            , "telegramGroupUpdatedDate" = $3::timestamptz
            where id = $4`,
        [channelId, channelHash, today, eventId]
      );
    });

    const eventVolunteerIds = eventVolunteers
      .map((ev) => ev.evid)
      .reduce((a, b) => a + b + ",", "")
      .slice(0, -1);

    await getConnection().transaction(async (tm) => {
      tm.query(
        `
            UPDATE eventvolunteer
            set "joinedTelegram" = true, "joinedTelegramDate" = $1::timestamptz
            from (select unnest(string_to_array($2,',')::int[]) as id ) as evidd
            where eventvolunteer.id = evidd.id
            `,
        [today, eventVolunteerIds]
      );
    });

    return {
      success: true,
      event: ev,
    };
  }

  @Mutation(() => EventResponse)
  @UseMiddleware(isAuth)
  async updateTelegramGroupMembersForEvent(
    @Arg("eventId", () => Int) eventId: number,
    @Ctx() { req }: MyContext
  ): Promise<EventResponse> {
    if (!req.session.userId) {
      return {
        errors: [
          {
            field: "User",
            message: "User is not authenticated.",
          },
        ],
        success: false,
      };
    }

    const ev = await Event.findOne({ where: { id: eventId, auditstat: true } });

    if (!ev) {
      return {
        errors: [
          {
            field: "Event",
            message: "That event does not exist.",
          },
        ],
        success: false,
      };
    }

    const charityId = ev.charityId;

    if (!req.session.charityAdminIds) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    const adids = req.session.charityAdminIds.reduce(
      (a, b) => a || b === charityId,
      false
    );

    if (!adids) {
      return {
        errors: [
          { field: "Charity", message: "User is not an admin of charity." },
        ],
        success: false,
      };
    }

    if (
      !ev.telegramGroupHash ||
      !ev.telegramGroupId ||
      !ev.telegramGroupUpdatedDate
    ) {
      return {
        errors: [
          {
            field: "Telegram group",
            message: `A telegram group does not exist for this event. You need to create a group instead`,
          },
        ],
        success: false,
      };
    }

    const date = ev.telegramGroupUpdatedDate;
    console.log(date);

    // filtered based on whether user has joined telegram group or not
    const filteredEventVolunteers = await getConnection()
      .createQueryBuilder()
      .select(
        `distinct volun.id as evid, u.id as userid, 
      ur.id as urid, ur."roleName", up."telegramHandle"`
      )
      .from(Event, `ev`)
      .innerJoin(Eventvolunteer, `volun`, `volun."eventId" = ev.id`)
      .innerJoin(Userrole, `ur`, `ur.id = volun."userroleId"`)
      .innerJoin(User, `u`, `u.id = volun."userId"`)
      .innerJoin(Userprofile, `up`, `up."userId" = u.id`)
      .where(`volun.adminapproval = 'approved'`)
      .andWhere(`volun.auditstat = true`)
      .andWhere(`ev.auditstat = true`)
      .andWhere(`ev.id = :eid`, { eid: eventId })
      .andWhere(`volun."joinedTelegram" = false`)
      .andWhere(`up."telegramHandle" is not null`)
      .getRawMany<{
        evid: number;
        userid: number;
        urid: number;
        roleName: string;
        telegramHandle: string;
      }>();

    if (filteredEventVolunteers.length === 0) {
      return {
        success: false,
        errors: [
          { field: "Members", message: "There are no new members to add." },
        ],
      };
    }

    const charUsers = filteredEventVolunteers
      .filter((ev) => ev.urid === 1)
      .map((ev) => ev.telegramHandle)
      .reduce((a, b) => a + b + `,`, ``)
      .slice(0, -1);

    const nonCharUsers = filteredEventVolunteers
      .filter((ev) => ev.urid === 2)
      .map((ev) => ev.telegramHandle)
      .reduce((a, b) => a + b + `,`, ``)
      .slice(0, -1);

    const res = addNewUsersToChannel(
      ev.telegramGroupId,
      ev.telegramGroupHash,
      charUsers,
      nonCharUsers
    );

    if (!res.success) {
      return {
        success: res.success,
        errors: res.errors,
        timeout: res.timeout,
      };
    }

    const today = new Date(Date.now());

    await getConnection().transaction(async (tm) => {
      tm.query(
        `UPDATE event 
              set "telegramGroupUpdatedDate" = $1::timestamptz
              where id = $2`,
        [today, eventId]
      );
    });

    const eventVolunteerIds = filteredEventVolunteers
      .map((ev) => ev.evid)
      .reduce((a, b) => a + b + ",", "")
      .slice(0, -1);

    await getConnection().transaction(async (tm) => {
      tm.query(
        `
            UPDATE eventvolunteer
            set "joinedTelegram" = true, "joinedTelegramDate" = $1::timestamptz
            from (select unnest(string_to_array($2,',')::int[]) as id ) as evidd
            where eventvolunteer.id = evidd.id
        `,
        [today, eventVolunteerIds]
      );
    });

    return {
      success: true,
      event: ev,
    };
  }
}
