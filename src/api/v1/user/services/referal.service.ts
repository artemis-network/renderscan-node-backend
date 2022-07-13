import { DBObject } from "../../db_object";
import { db, UserInterface } from "../../db"
import { Err, ErrorFactory, ErrorTypes } from "../../errors/error_factory";
const { ReferalModel, UserModel } = db

export class ReferalService {
	static getUserByReferalCode = async (referalCode: string) => {
		try {
			return await new DBObject(
				await UserModel.findOne({ referalCode: referalCode })
			).get() as UserInterface;
		} catch (error) {
			throw ErrorFactory.OBJECT_NOT_FOUND("object not found");
		}
	}

	static getUserReferalsAndAddNewReferal = async (userId: string, referalId: string) => {
		try {
			const referal = new DBObject(await ReferalModel.findOne({ user: userId })).get()
			await referal.updateOne({ referal: [...referal.referal, referalId] })
			await referal.save();
			return referal;
		} catch (error) {
			const err = error as Err;
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				err.name == ErrorTypes.OBJECT_UN_DEFINED_ERROR) {
				return await ReferalModel.create({ user: userId, referal: [referalId] })
			}
		}
	}
}