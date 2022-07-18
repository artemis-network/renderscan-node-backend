import mongoose, { Schema, Model, Document } from 'mongoose';

export enum RewardType { SIGNUP = "SIGNUP", REFERAL = "REFERAL", DAILY = "DAILY", CHALLENGE_COMPLETION = "CHALLENGE_COMPLETION" }
export interface RewardInterface { amount: number; description: string; type: RewardType }
export interface RewardDoc extends RewardInterface, Document { }

const Rewardchema = new Schema({
	amount: { type: Schema.Types.Number, required: true },
	description: { type: Schema.Types.String, required: true },
	type: {
		type: Schema.Types.String, enum: [
			RewardType.CHALLENGE_COMPLETION, RewardType.REFERAL,
			RewardType.DAILY, RewardType.SIGNUP],
		required: true
	}
});

export const REWARD_NAMING: string = 'REWARD';

export class Reward {
	reward: RewardInterface;
	constructor(reward: RewardInterface) { this.reward = reward }
	setAmount(amount: RewardInterface["amount"]) {
		this.reward.amount = amount
		return this;
	}
	setDescription(description: RewardInterface["description"]) {
		this.reward.description = description;
		return this;
	}
	setType(type: RewardInterface["type"]) {
		this.reward.type = type;
		return this;
	}
	get() { return this.reward; }
}

export const RewardModel: Model<RewardDoc> = mongoose
	.model<RewardDoc>(REWARD_NAMING, Rewardchema);