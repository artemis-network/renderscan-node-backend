import { db } from '../../db'
import { UserServices, Role } from '../services/user.service'
import { logger } from '../../utils/logger';
import { Request, Response } from 'express'

const { UserModel } = db

import { ADMIN } from '../../../../config'
import { HttpFactory } from '../../http/http_factory';

export class UserBootStartController {
	static initialize = async (req: Request, res: Response) => {
		const deposit: number = 1000000
		const userCount = await UserModel.find().countDocuments();
		if (userCount <= 0) {
			logger.info(">> create admin user")
			const hash = await UserServices.hashPassword(ADMIN.password);
			const user = await UserServices.createUser(ADMIN.username, ADMIN.email, hash, Role.ADMIN, false)
			const details = await UserServices.createWalletForUser(user?._id);
			logger.info(">> successfully admin user")
			return HttpFactory.STATUS_200_OK({ message: "OK" }, res)
		}
		return HttpFactory.STATUS_200_OK({ message: "FAILED" }, res)
	}
}
