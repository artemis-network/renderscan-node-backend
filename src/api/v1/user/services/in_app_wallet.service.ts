import { db, TransactionInterface } from "../../db"
import { logger } from "../../utils/logger";
import { ErrorFactory, Err, ErrorTypes } from "../../errors/error_factory";
import { DBObject } from "../../db_object";

const { InAppWalletModel, TranscationModel } = db

interface WalletDetails { error?: boolean, message?: string; balance?: number; _id?: string }
interface Wallet {
	walletId: string
}

export class InAppWalletServices {

	static createTranascation = async (transaction: TransactionInterface) => {
		try {
			await (await TranscationModel.create(transaction)).save();
		} catch (e) {
			const err = e as Err;
			throw ErrorFactory.TYPE_ERROR(err.message);
		}
	}


	static getWallet = async (userId: string): Promise<{ walletId: string } | any> => {
		try {
			const query = await InAppWalletModel.findOne({ user: userId })
			const object = new DBObject(query).get();
			return { walletId: object._id };
		} catch (e) {
			const err = e as Err;
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
			) throw ErrorFactory.OBJECT_NOT_FOUND("object not found")
		}
	}

	static getInAppWallet = async (userId: string): Promise<WalletDetails> => {
		try {
			const query = await InAppWalletModel.findOne({ user: userId })
			const object = new DBObject(query);
			const wallet = object.get()
			return { error: false, message: "ok", balance: wallet?.balance, _id: wallet._id }
		} catch (e) {
			const err = e as Err;
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				err.name === ErrorTypes.OBJECT_UN_DEFINED_ERROR
			) {
				return { error: false, message: "ok", balance: 0 }
			}
		} finally {
			return { error: false, message: "ok", balance: 0 };
		}
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
