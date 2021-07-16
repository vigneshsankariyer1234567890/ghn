// create new loader for each field to optimise

import DataLoader from "dataloader";
import { getConnection } from "typeorm";
import { Category } from "../../entities/Category";
import { Charitycategory } from "../../entities/Charitycategory";
import { Usercategory } from "../../entities/Usercategory";
// import { UserCategory } from "../entities/UserCategory";

export const createCategoryLoader = () =>
  new DataLoader<number, Category>(async (catids) => {
    const categories = await Category.findByIds(catids as number[]);
    const categoryIdToCategory: Record<number, Category> = {};
    categories.forEach((cat) => {
      categoryIdToCategory[cat.id] = cat;
    });
    return catids.map((catId) => categoryIdToCategory[catId]);
  });

export const createCharityCategoryLoader = () =>
  new DataLoader<number, Charitycategory[]>(async (charIds) => {
    const sqlquerystring = charIds
      .map<string>((k) => `(cc."charityId" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);

    const cats = await getConnection()
      .createQueryBuilder()
      .select(`cc.*`)
      .from(Charitycategory, `cc`)
      .where(`(` + sqlquerystring + `)`)
      .andWhere(`cc.auditstat = true`)
      .getRawMany<Charitycategory>();

    const charityIdsToCats: Record<number, Charitycategory[]> = {};

    charIds.forEach((k) => {
      const c = cats.filter((cc) => cc.charityId === k);
      charityIdsToCats[k] = c;
    });

    return charIds.map((key) => charityIdsToCats[key]);

  });

  export const createUserCategoryLoader = () =>
  new DataLoader<number, Usercategory[]>(async (userIds) => {
    const sqlquerystring = userIds
      .map<string>((k) => `(uc."userId" = ${k})`)
      .reduce<string>((a, b) => a + ` or ` + b, ``)
      .slice(3);

    const cats = await getConnection()
      .createQueryBuilder()
      .select(`uc.*`)
      .from(Usercategory, `uc`)
      .where(`(` + sqlquerystring + `)`)
      .andWhere(`uc.auditstat = true`)
      .getRawMany<Usercategory>();

    const charityIdsToCats: Record<number, Usercategory[]> = {};

    userIds.forEach((k) => {
      const c = cats.filter((cc) => cc.userId === k);
      charityIdsToCats[k] = c;
    });

    return userIds.map((key) => charityIdsToCats[key]);

  });
