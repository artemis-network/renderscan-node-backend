import mongoose, { Schema, Model, Document } from 'mongoose';
import { USER_NAMING } from './user.model'

export interface ReferalInterface {
	referal: string[];
	user: string
}
export interface ReferalDoc extends ReferalInterface, Document { }

const referalchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: USER_NAMING },
	referal: [{
		type: Schema.Types.ObjectId, ref: USER_NAMING
	}]
});

export const REFERAL: string = 'REFERAL';

export class Referal {
	referal: ReferalInterface;
	constructor(referal: ReferalInterface) { this.referal = referal }

	setReferal(referal: ReferalInterface["referal"]) {
		this.referal.referal = referal
		return this;
	}
	setUser(user: ReferalInterface["user"]) {
		this.referal.user = user;
		return this;
	}
	get() { return this.referal; }
}

export const ReferalModel: Model<ReferalDoc> = mongoose
	.model<ReferalDoc>(REFERAL, referalchema);