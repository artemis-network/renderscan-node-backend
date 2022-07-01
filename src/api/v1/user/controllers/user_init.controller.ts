import { db } from '../../db'
import { UserServices, Role } from '../services/user.service'
import { InAppWalletServices } from '../services/in_app_wallet.service';
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
			const user = await UserServices.createUser(ADMIN.username, ADMIN.email, ADMIN.password, Role.ADMIN, false)
			const createdUser = await UserServices.getUserByEmail(ADMIN.email);
			const details = await InAppWalletServices.depositFunds(createdUser?._id, deposit)
			console.log(details)
			logger.info(">> successfully admin user")
			return HttpFactory.STATUS_200_OK({ message: "OK" }, res)
		}
		return HttpFactory.STATUS_200_OK({ message: "FAILED" }, res)
	}
}
