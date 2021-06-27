import {Request, Response} from 'express'
import { Session, SessionData } from "express-session";
import { Redis } from 'ioredis'
import { createCategoryLoader } from './utils/dataloaders/createInterestsLoader';
import { createLikesLoader } from './utils/dataloaders/createLikesLoader';
import { createUserLoader } from './utils/dataloaders/createUserLoader';
import { createEventLikesLoader } from './utils/dataloaders/createEventLikesLoader';
import { createCharityLoader } from './utils/dataloaders/createCharityLoader';
import { createCharityFollowLoader } from './utils/dataloaders/createCharityFollowLoader';
import { createEventLoader } from './utils/dataloaders/createEventLoader';

export type MyContext = {
  req: Request & {session: Session & Partial<SessionData> & {userId?: number}};
  redis: Redis;
  res: Response;
  userLoader: ReturnType<typeof createUserLoader>;
  likeLoader: ReturnType<typeof createLikesLoader>;
  categoryLoader: ReturnType<typeof createCategoryLoader>;
  eventLikeLoader: ReturnType<typeof createEventLikesLoader>;
  charityLoader: ReturnType<typeof createCharityLoader>;
  charityFollowLoader: ReturnType<typeof createCharityFollowLoader>;
  eventLoader: ReturnType<typeof createEventLoader>
};