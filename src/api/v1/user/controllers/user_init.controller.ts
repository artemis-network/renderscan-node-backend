import { Request, Response } from 'express';
import { initUser } from '../user.init'

export const userInitController = async (req: Request, res: Response) => {
	const data = await initUser()
	return res.status(200).json(data)
}