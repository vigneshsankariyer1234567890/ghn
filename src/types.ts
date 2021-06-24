import {Request, Response} from 'express'
import { Session, SessionData } from "express-session";
import { Redis } from 'ioredis'
import { createCategoryLoader } from './utils/dataloaders/createInterestsLoader';
import { createLikesLoader } from './utils/dataloaders/createLikesLoader';
import { createUserLoader } from './utils/dataloaders/createUserLoader';
import { createEventLikesLoader } from './utils/dataloaders/createEventLikesLoader';

export type MyContext = {
  req: Request & {session: Session & Partial<SessionData> & {userId?: number}};
  redis: Redis;
  res: Response;
  userLoader: ReturnType<typeof createUserLoader>;
  likeLoader: ReturnType<typeof createLikesLoader>;
  categoryLoader: ReturnType<typeof createCategoryLoader>;
  eventLikeLoader: ReturnType<typeof createEventLikesLoader>
};