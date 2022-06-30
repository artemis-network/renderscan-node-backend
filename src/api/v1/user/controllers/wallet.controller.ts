import { Request, Response } from 'express'
import { WalletServices } from '../services/wallet.service'

export class WalletController {

	static getWalletController = async (req: Request, res: Response) => {
		const { userId } = req.body
		const result = await WalletServices.getWallet(userId)
		return res.status(200).json(result)
	}

	static depositFundsController = async (req: Request, res: Response) => {
		const { userId, amount, password } = req.body
		if (password === "password@1234") {
			const result = await WalletServices.depositFunds(userId, amount);
			return res.status(200).json(result)
		}
		return res.status(200).json({ message: "invalid password", error: true })
	}
}
