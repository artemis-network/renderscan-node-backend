import mongoose, { Schema, Model, Document } from 'mongoose';
import { USER_NAMING } from './user.model'

export interface ReferalsInterface {
	referals: string[];
	user: string
}
export interface ReferalsDoc extends ReferalsInterface, Document { }

const referalSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: USER_NAMING },
	// referals: [{
	// 	type: Schema.Types.ObjectId, ref: USER_NAMING
	// }]
});

export const REFERALS: string = 'REFERALS';

export class Referals {
	referals: ReferalsInterface;
	constructor(referals: ReferalsInterface) { this.referals = referals }

	setReferals(referals: ReferalsInterface["referals"]) {
		this.referals.referals = referals
		return this;
	}
	setUser(user: ReferalsInterface["user"]) {
		this.referals.user = user;
		return this;
	}
	get() {
		return this.referals;
	}
}

export const ReferalsModel: Model<ReferalsDoc> = mongoose
	.model<ReferalsDoc>(REFERALS, referalSchema);