import { getConnection } from "typeorm";
import { User } from "../entities/User";

export class SystemProcesses {
  static async deleteUnverifiedUsers() {
    
    let date: Date;
    date = new Date(Date.now());
    date = new Date(date.setHours(date.getHours() - 24*5));

    const unverifiedUsers = await getConnection()
      .createQueryBuilder()
      .select(`u.*`)
      .from(User, `u`)
      .where(`u.verified = false`)
      .andWhere(`u."updatedAt" < :cursor::timestamp`, { cursor: date })
      .getRawMany<User>();
    
    await getConnection().transaction(async tm => {
        await tm.createQueryBuilder()
            .delete()
            .from(User, `u`)
            .whereInIds(unverifiedUsers.map(u => u.id))
            .execute();
    });
  }
}
