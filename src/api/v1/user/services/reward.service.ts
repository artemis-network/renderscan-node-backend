import { rewards } from '../data/rewards'
import { DBObject } from "../../db_object";
import { ErrorFactory, } from "../../errors/error_factory";
import { db, RewardDoc, RewardInterface } from "../../db"
import { RewardType } from '../models/reward.model';

const { RewardModel } = db
export class RewardService {

	static getRewardByType = async (type: RewardType) => {
		try {
			return await new DBObject(await RewardModel.findOne({ type: type })).get() as RewardDoc;
		} catch (error) {
			throw ErrorFactory.OBJECT_NOT_FOUND("reward not found");
		}
	}

	static initRewards = async () => {
		try {
			const count = await RewardModel.countDocuments();
			if (count <= 0) {
				const data: RewardInterface[] = rewards;
				data.map(async (r) => {
					console.log(r)
					await (await RewardModel.create(r)).save();
				})
			}
		} catch (error) {
			throw ErrorFactory.TYPE_ERROR("type error")
		}
	}
}