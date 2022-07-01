import { NextFunction, Request, Response } from "express";
import { JWT } from "../utils/jwt";
import { Role } from '../user/services/user.service'
import { db } from '../db';

const { UserModel } = db

interface Session { role: Role, userId: string }

const authorizeUserMiddleWare = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const token = req.headers['authorization']?.toString();
		let decoded = JWT.decodeJWTToken(token || "");
		const session = decoded.session
		const user = await UserModel.findById(session.userId)
		const isExpired = decoded.expires < new Date().getTime()
		if ((user !== null || user !== undefined) && !isExpired) {
			req.body.userId = user?._id;
			req.body.userType = user?.userType;
			return next();
		}
		return res.status(403).json({ messsage: "Invalid jwt token" })
	} catch (e) {
		console.log(e)
		return res.status(403).json({ messsage: "Invalid jwt token" })
	}
}

export { authorizeUserMiddleWare }
