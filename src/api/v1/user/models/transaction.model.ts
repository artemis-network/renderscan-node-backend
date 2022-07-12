import mongoose, { Schema, Model, Document } from 'mongoose';

import { IN_APP_WALLET_NAMING } from './in_app_wallet.model';
import { RAZORPAY_NAMING } from './razorpay.model'

export interface TransactionInterface {
	amount?: number; description?: string; walletId?: string;
	paymentType?: PAYMENT_TYPE; razorPayInfo?: string; createdAt?: Date
}

export interface TransactionDoc extends TransactionInterface, Document { }

export enum PAYMENT_TYPE { RAZOR_PAY = "RAZOR_PAY", SIGNUP_REWARD = "SIGNUP_REWARD", REFERAL_REWARD = "REFERAL_REWARD", }

const TranscationSchema = new Schema({
	amount: { type: Schema.Types.Number, required: true },
	razorPayInfo: { type: Schema.Types.ObjectId, ref: RAZORPAY_NAMING },
	createdAt: { type: Schema.Types.Date, default: new Date(), },
	description: { type: Schema.Types.String },
	paymentType: { type: Schema.Types.String, enum: [PAYMENT_TYPE.SIGNUP_REWARD, PAYMENT_TYPE.RAZOR_PAY, PAYMENT_TYPE.REFERAL_REWARD], required: true },
	walletId: { type: Schema.Types.ObjectId, ref: IN_APP_WALLET_NAMING },
});

export class Transaction {

	transcation: TransactionInterface;
	constructor(transaction: TransactionInterface) { this.transcation = transaction }
	setAmount(amount: TransactionInterface["amount"]) {
		this.transcation.amount = amount
		return this;
	}
	setRazorPay(razorPay: TransactionInterface["razorPayInfo"]) {
		this.transcation.razorPayInfo = razorPay
		return this;
	}
	setCreatedAt(createdAt: TransactionInterface["createdAt"]) {
		this.transcation.createdAt = createdAt
		return this;
	}
	setDescription(description: TransactionInterface["description"]) {
		this.transcation.description = description
		return this;
	}
	setPaymentType(paymentType: TransactionDoc["paymentType"]) {
		this.transcation.paymentType = paymentType
		return this;
	}
	setWalletId(walletId: TransactionInterface["walletId"]) {
		this.transcation.walletId = walletId
		return this;
	}
	get() { return this.transcation; }
}

export const TRANSACTION_NAMING = "TRANSACTION"

export const TranscationModel: Model<TransactionDoc> = mongoose
	.model<TransactionDoc>(TRANSACTION_NAMING, TranscationSchema);