import { db, InAppWalletInterface, classes } from "../../db"
const { InAppWalletModel, TranscationModel } = db
import { logger } from "../../utils/logger";
import { ErrorFactory, Err, ErrorTypes } from "../../errors/error_factory";
import { DBObject } from "../../db_object";

import { PAYMENT_TYPE, Transaction, TransactionInterface } from '../models/transaction.model'
const { RazorPay } = classes

interface WalletDetails { error?: boolean, message?: string; balance?: number; }

export class InAppWalletServices {

	static createTranascation = async (transaction: TransactionInterface) => {
		await TranscationModel.create(transaction);
	}

	static getInAppWallet = async (userId: string): Promise<WalletDetails> => {
		try {
			const query = await InAppWalletModel.findOne({ user: userId })
			const object = new DBObject(query);
			const wallet = object.get() as InAppWalletInterface
			return { error: false, message: "ok", balance: wallet?.balance }
		} catch (e) {
			const err = e as Err;
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
				return { error: false, message: "ok", balance: 0 }
			}
			if (err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR) {
				return { error: false, message: "ok", balance: 0 }
			}
		}
		return { error: false, message: "ok", balance: 0 };
	}

	static depositFunds = async (userId: string, amount: number): Promise<any> => {
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

	static deductFunds = async (userId: string, amount: number): Promise<any> => {
		const wallet: any = await InAppWalletModel.findOne({ user: userId });
		const currentBalance = await wallet?.balance || 0;
		await wallet?.updateOne({ $set: { balance: currentBalance - amount } })
		await wallet?.save()
		return { error: false, message: "ok", balance: wallet?.balance }
	}
}
