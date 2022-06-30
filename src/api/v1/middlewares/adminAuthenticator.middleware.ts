import { NextFunction, Request, Response } from "express";
import { db } from '../db';
import { API_ADMIN_PASSWORD } from '../../../config'

export const adminAuthenticatorMiddleWare = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { password } = req.body
		if (password === API_ADMIN_PASSWORD)
			return next()
		return res.status(403).json({ messsage: "Unauthorized access" })
	} catch (e) {
		return res.status(403).json({ messsage: "Unauthorized access" })
	}
}
