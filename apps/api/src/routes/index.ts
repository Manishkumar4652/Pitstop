import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from './auth';
import { restStopsRouter } from './restStops';
import { dealsRouter } from './deals';
import { jobsRouter } from './jobs';
import { adminRouter } from './admin';
import { checkInsRouter } from './checkIns';
import { merchantRouter } from './merchant';
import { riderRouter } from './rider';

export const v1Router = Router();

// Mount sub-routers under /api/v1
v1Router.use('/health', healthRouter);
v1Router.use('/auth', authRouter);
v1Router.use('/rest-stops', restStopsRouter);
v1Router.use('/deals', dealsRouter);
v1Router.use('/jobs', jobsRouter);
v1Router.use('/check-ins', checkInsRouter);
v1Router.use('/merchant', merchantRouter);
v1Router.use('/rider', riderRouter);
v1Router.use('/admin', adminRouter);





