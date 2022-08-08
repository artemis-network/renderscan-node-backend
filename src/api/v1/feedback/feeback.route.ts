import express from 'express';
import { feedbackPrefix } from '../config';
import { FeedBackController } from './feecback.controller';

const router = express.Router();

router.post(`${feedbackPrefix}/post`, FeedBackController.createFeedBack)

export { router as feedbackRoutes }