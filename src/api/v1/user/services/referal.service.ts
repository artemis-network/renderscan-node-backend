import { DBObject } from "../../db_object";
import { db } from "../../db"
import { Err, ErrorFactory, ErrorTypes } from "../../errors/error_factory";
const { ReferalModel, UserModel } = db

interface AwardReferer { userId: string, referalId: string }

export class ReferalService {
	static getUserByReferalCode = async (referalCode: string) => {
		try {
			return new DBObject(
				await UserModel.findOne({ referalCode: referalCode })
			).get();
		} catch (error) {
			throw error;
		}
	}

	static getReferals = async (userId: string) => {
		try {
			const refs = await ReferalModel.findOne({ user: userId }).populate("referal") as any;
			const response = []
			for (let i = 0; i < refs.referal.length; i++) {
				const resp = {
					username: refs.referal[i].username,
					avatarUrl: refs.referal[i].avatarUrl ?? null,
					amount: 100
				}
				response.push(resp)
			}
			return response;
		} catch (error) {
			console.log(error)
			throw error;
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
			if (err.name === ErrorTypes.OBJECT_NOT_FOUND_ERROR) {
				const referal = await ReferalModel.create({
					user: input.userId,
					referal: [input.referalId]
				})
				await referal.save();
				return referal
			}
		}
	}
}