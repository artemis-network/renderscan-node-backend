import mongoose, { Schema, Model, Document } from 'mongoose';
import { UserInterface, USER_NAMING } from './user.model'

export interface InAppWalletInterface { balance: number; isActive: Boolean; user: UserInterface | string }
export interface InAppWalletDoc extends InAppWalletInterface, Document { }

const inAppWalletSchema = new Schema({
	user: { type: Schema.Types.ObjectId, ref: USER_NAMING },
	isActive: { type: Schema.Types.Boolean, required: true, },
});

export const IN_APP_WALLET_NAMING: string = 'IN_APP_WALLET';

export class InAppWallet {
	wallet: InAppWalletInterface;
	constructor(wallet: InAppWalletInterface) { this.wallet = wallet }
	setIsActive(isActivate: InAppWalletInterface["isActive"]) {
		this.wallet.isActive = isActivate
		return this;
	}
	setUser(user: InAppWalletInterface["user"]) {
		this.wallet.user = user;
		return this;
	}
	get() {
		return this.wallet;
	}
}

export const InAppWalletModel: Model<InAppWalletDoc> = mongoose
	.model<InAppWalletDoc>(IN_APP_WALLET_NAMING, inAppWalletSchema);