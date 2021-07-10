import { Request, Response } from "express";
import { Session, SessionData } from "express-session";
import { Redis } from "ioredis";
import {
  createCategoryLoader,
  createUserCategoryLoader,
  createCharityCategoryLoader,
} from "./utils/dataloaders/createInterestsLoader";
import { createLikesLoader } from "./utils/dataloaders/createLikesLoader";
import { createUserLoader } from "./utils/dataloaders/createUserLoader";
import { createEventLikesArrayLoader, createEventLikesLoader } from "./utils/dataloaders/createEventLikesLoader";
import { createCharityLoader } from "./utils/dataloaders/createCharityLoader";
import { createEventLoader, createCEventsLoader } from "./utils/dataloaders/createEventLoader";
import { createEventVolunteerLoader } from "./utils/dataloaders/createEventVolunteerLoader";
import { createTaskListLoader } from "./utils/dataloaders/createTaskListLoader";
import { createTaskVolunteerListLoader } from "./utils/dataloaders/createTaskVolunteerListLoader";
import {
  createSingleCharityFollowLoader,
  createCharityFollowersLoader,
  createUserCharityFollowsLoader
} from "./utils/dataloaders/createCharityFollowLoader";
import { createCharityAdminRolesLoader } from "./utils/dataloaders/createCharityAdminRoleLoader";

export type MyContext = {
  req: Request & {
    session: Session &
      Partial<SessionData> & { userId?: number; charityAdminIds?: number[] };
  };
  redis: Redis;
  res: Response;
  userLoader: ReturnType<typeof createUserLoader>;
  likeLoader: ReturnType<typeof createLikesLoader>;
  categoryLoader: ReturnType<typeof createCategoryLoader>;
  charityCategoryLoader: ReturnType<typeof createCharityCategoryLoader>;
  userCategoryLoader: ReturnType<typeof createUserCategoryLoader>;
  eventLikeLoader: ReturnType<typeof createEventLikesLoader>;
  userEventLikesLoader: ReturnType<typeof createEventLikesArrayLoader>;
  charityLoader: ReturnType<typeof createCharityLoader>;
  eventLoader: ReturnType<typeof createEventLoader>;
  charityEventsLoader: ReturnType<typeof createCEventsLoader>;
  eventVolunteerLoader: ReturnType<typeof createEventVolunteerLoader>;
  userTaskListLoader: ReturnType<typeof createTaskListLoader>;
  taskVolunteerListLoader: ReturnType<typeof createTaskVolunteerListLoader>;
  singleCharityFollowLoader: ReturnType<typeof createSingleCharityFollowLoader>;
  charityFollowersLoader: ReturnType<typeof createCharityFollowersLoader>;
  userCharityFollowsLoader: ReturnType<typeof createUserCharityFollowsLoader>
  charityAdminRoleLoader: ReturnType<typeof createCharityAdminRolesLoader>
};
