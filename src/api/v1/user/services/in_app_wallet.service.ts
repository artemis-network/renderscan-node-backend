import { db, TransactionInterface } from "../../db"
import { ErrorFactory, Err, ErrorTypes } from "../../errors/error_factory";
import { DBObject } from "../../db_object";

const { InAppWalletModel, TranscationModel } = db
export class InAppWalletServices {
	static createTranascation = async (transaction: TransactionInterface) => {
		try {
			await (await TranscationModel.create(transaction)).save();
		} catch (e) {
			const err = e as Err;
			throw ErrorFactory.TYPE_ERROR(err.message);
		}
	}
	static getWallet = async (userId: string) => {
		try {
			const wallet = new DBObject(await InAppWalletModel.findOne({ user: userId })).get();
			return { walletId: wallet._id };
		} catch (e) {
			throw e;
		}
	}

	static cleanUpWallet = async (userId: string) => {
		await InAppWalletModel.findOneAndRemove({ user: userId })
	}

}
