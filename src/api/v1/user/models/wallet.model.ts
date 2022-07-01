import mongoose, { Schema, Model, Document } from 'mongoose';
import { UserInterface } from './user.model'

export interface InAppWalletInterface { balance: number; isActive: Boolean; user: UserInterface | string }
export interface InAppWalletDoc extends InAppWalletInterface, Document { }

const inAppWalletSchema = new Schema({
	balance: { type: Schema.Types.Number, required: true, default: 5000 },
	isActive: { type: Schema.Types.Boolean, required: true, },
	user: { type: Schema.Types.ObjectId, ref: 'User' }
});

export class InAppWallet {
	wallet: InAppWalletInterface;
	constructor(wallet: InAppWalletInterface) { this.wallet = wallet }
	setBalance(balance: InAppWalletInterface["balance"]) {
		this.wallet.balance = balance
		return this;
	}
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
	.model<InAppWalletDoc>('IN_APP_WALLET', inAppWalletSchema);