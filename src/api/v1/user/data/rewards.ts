import { RewardInterface, RewardType } from '../models/reward.model'

export const rewards: RewardInterface[] = [
	{
		amount: 100,
		description: "Referal bonous",
		type: RewardType.REFERAL
	},
	{
		amount: 200,
		description: "Signup bonous",
		type: RewardType.SIGNUP
	},
	{
		amount: 50,
		description: "Daily Bonous",
		type: RewardType.DAILY
	},
]