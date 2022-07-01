import { db } from "../../db"
import { logger } from "../../utils/logger";
const { InAppWalletModel } = db

interface Result { error?: boolean, message?: string; balance?: number; }

export class InAppWalletServices {

	static getWallet = async (userId: string): Promise<Result> => {
		if (userId) {
			const wallet = await InAppWalletModel.findOne({ user: userId })
			return { error: false, message: "ok", balance: wallet?.balance }
		}
		return { error: true, message: "userid undefined", balance: 0 }
	}

	static depositFunds = async (userId: string, amount: number): Promise<Result> => {
		const wallet = await InAppWalletModel.findOne({ user: userId });
		logger.info(`>> depositing ${amount} funds to ${userId}`)
		await wallet?.updateOne({ $set: { balance: (wallet?.balance + amount) } })
		await wallet?.save()
		return { error: false, message: "ok", balance: wallet?.balance }
	}

	static getBalance = async (userId: string) => {
		const wallet = await InAppWalletModel.findOne({ user: userId });
		return wallet?.balance || 0;
	}

	static deductFunds = async (userId: string, amount: number): Promise<Result> => {
		const wallet: any = await InAppWalletModel.findOne({ user: userId });
		const currentBalance = await wallet?.balance || 0;
		await wallet?.updateOne({ $set: { balance: currentBalance - amount } })
		await wallet?.save()
		return { error: false, message: "ok", balance: wallet?.balance }
	}
}
