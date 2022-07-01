import { Request, Response } from 'express'
import { InAppWalletServices } from '../services/in_app_wallet.service'

export class InAppWalletController {

	static getWallet = async (req: Request, res: Response) => {
		const { userId } = req.body
		const result = await InAppWalletServices.getWallet(userId)
		return res.status(200).json(result)
	}

	static depositFunds = async (req: Request, res: Response) => {
		const { userId, amount, password } = req.body
		if (password === "password@1234") {
			const result = await InAppWalletServices.depositFunds(userId, amount);
			return res.status(200).json(result)
		}
		return res.status(200).json({ message: "invalid password", error: true })
	}
}
