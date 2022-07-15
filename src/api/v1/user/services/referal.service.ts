import { DBObject } from "../../db_object";
import { db } from "../../db"
import { Err, ErrorFactory, ErrorTypes } from "../../errors/error_factory";
const { ReferalModel, UserModel } = db

interface AwardReferer { userId: string, referalId: string }

export class ReferalService {
	static getUserByReferalCode = async (referalCode: string) => {
		try {
			return await new DBObject(
				await UserModel.findOne({ referalCode: referalCode })
			).get();
		} catch (error) {
			throw ErrorFactory.OBJECT_NOT_FOUND("object not found");
		}
	}

	static addReferal = async (input: AwardReferer) => {
		try {
			const referal = new DBObject(await ReferalModel.findOne({ user: input.userId })).get()
			await referal.updateOne({ referal: [...referal.referal, input.referalId] })
			await referal.save();
			return referal;
		} catch (error) {
			const err = error as Err;
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR ||
				err.name == ErrorTypes.OBJECT_UN_DEFINED_ERROR) {
				return await ReferalModel.create({ user: input.userId, referal: [input.referalId] })
			}
			throw error;
		}
	}
}