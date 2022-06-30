import mongoose, { Schema, Model, Document } from 'mongoose';
import { UserType } from '../../db'

export type UserWalletType = { balance: number; isActive: Boolean; user: UserType | string }

export type UserWalletDocument = Document & UserWalletType;

const UserWalletSchema = new Schema({
	balance: { type: Schema.Types.Number, required: true, default: 5000 },
	isActive: { type: Schema.Types.Boolean, required: true, },
	user: { type: Schema.Types.ObjectId, ref: 'User' }
});

export const UserWallet: Model<UserWalletDocument> = mongoose
	.model<UserWalletDocument>('User_Wallet', UserWalletSchema);
