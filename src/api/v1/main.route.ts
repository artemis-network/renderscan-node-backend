import express, { Request, Response } from 'express';

import { parentPrefix } from './config'

const router = express.Router();

router.get(`${parentPrefix}/ping`, (req: Request, res: Response) => res.status(200).json({ message: "WELCOME TO RENDERSCAN BACKEND" }))

export { router as pingRoutes }