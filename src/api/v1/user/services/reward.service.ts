import { DBObject } from "../../db_object";
import { ErrorFactory, } from "../../errors/error_factory";
import { db, RewardDoc, RewardInterface } from "../../db"
import { rewards } from '../data/rewards'

const { RewardModel } = db

export class RewardService {

	static getRewardById = async (rewardId: string) => {
		try {
			return await new DBObject(await RewardModel.findById(rewardId)).get() as RewardDoc;
		} catch (error) {
			throw ErrorFactory.OBJECT_NOT_FOUND("object not found");
		}
	}

	static initRewards = async () => {
		try {
			const count = await RewardModel.countDocuments();
			if (count < 0) {
				const data: RewardInterface[] = rewards;
				data.map(async (r) => {
					await (await RewardModel.create(r)).save();
				})
			}
		} catch (error) {
			throw ErrorFactory.TYPE_ERROR("type error")
		}
	}
}