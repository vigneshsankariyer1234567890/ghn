import {Request, Response} from 'express'
import { Session, SessionData } from "express-session";
import { Redis } from 'ioredis'
import { createCategoryLoader } from './utils/dataloaders/createInterestsLoader';
import { createLikesLoader } from './utils/dataloaders/createLikesLoader';
import { createUserLoader } from './utils/dataloaders/createUserLoader';
import { createEventLikesLoader } from './utils/dataloaders/createEventLikesLoader';
import { createCharityLoader } from './utils/dataloaders/createCharityLoader';
import { createEventLoader } from './utils/dataloaders/createEventLoader';
import { createEventVolunteerLoader } from './utils/dataloaders/createEventVolunteerLoader';
import { createTaskListLoader } from './utils/dataloaders/createTaskListLoader';
import { createTaskVolunteerListLoader } from './utils/dataloaders/createTaskVolunteerListLoader';

export type MyContext = {
  req: Request & {session: Session & Partial<SessionData> & {userId?: number, charityAdminIds?: number[]}};
  redis: Redis;
  res: Response;
  userLoader: ReturnType<typeof createUserLoader>;
  likeLoader: ReturnType<typeof createLikesLoader>;
  categoryLoader: ReturnType<typeof createCategoryLoader>;
  eventLikeLoader: ReturnType<typeof createEventLikesLoader>;
  charityLoader: ReturnType<typeof createCharityLoader>;
  eventLoader: ReturnType<typeof createEventLoader>;
  eventVolunteerLoader: ReturnType<typeof createEventVolunteerLoader>;
  userTaskListLoader: ReturnType<typeof createTaskListLoader>;
  taskVolunteerListLoader: ReturnType<typeof createTaskVolunteerListLoader>
};